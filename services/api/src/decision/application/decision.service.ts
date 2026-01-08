import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IDecisionLogRepository } from '../domain/decision-log.repository.interface';
import { ScaffoldingService } from './scaffolding.service';
import { ScaffoldingSignalDetectorService } from './scaffolding-signal-detector.service'; // SCRIPT 03 - Fase 2
import { TelemetryService } from '../../telemetry/telemetry.service';
import { TelemetryEventType } from '../../telemetry/domain/telemetry.constants';
import {
  DecisionInput,
  DecisionOutput,
  DecisionPolicy,
  DecisionAction,
  DecisionResultV2,
  SuppressReason,
} from '../domain/decision.types';
import { ScaffoldingLevel } from '../domain/scaffolding.types'; // SCRIPT 03
import {
  SuppressionContext,
  computeSuppressReasons,
  isSuppressed,
} from '../domain/decision.suppress';
import { DecisionChannel, DecisionReason } from '@prisma/client';
import { AiServiceClient } from '../../ai-service/ai-service.client';
import type { TransferIntent } from '../../ai-service/dto/transfer-task.dto';
import { DcsCalculatorService } from '../weighting/dcs-calculator.service'; // GRAPH SCRIPT 09
import { DcsIntegrationHelper } from '../weighting/dcs-integration.helper'; // GRAPH SCRIPT 09

/**
 * Decision Service
 * 
 * The "brain" of the intervention system. Evaluates user signals and decides:
 * - When to stay invisible (NO_OP)
 * - When to show hints or prompts
 * - When to assign missions
 * - When to call the LLM agent (AGENT SCRIPT A: Transfer Graph)
 * 
 * Follows a deterministic waterfall of heuristics to maximize learning
 * while minimizing token costs.
 */
@Injectable()
export class DecisionService {
  private readonly logger = new Logger(DecisionService.name);
  
  // SCRIPT 10: Short-term cache to prevent duplicate decisions (10s TTL)
  private readonly decisionCache = new Map<string, { result: DecisionOutput; timestamp: number }>();
  private readonly CACHE_TTL_MS = 10000; // 10 seconds

  constructor(
    private readonly prisma: PrismaService,
    @Inject(IDecisionLogRepository)
    private readonly logRepository: IDecisionLogRepository,
    private readonly scaffoldingService: ScaffoldingService,
    private readonly scaffoldingSignalDetector: ScaffoldingSignalDetectorService, // SCRIPT 03 - Fase 2
    private readonly telemetryService: TelemetryService,
    private readonly aiServiceClient: AiServiceClient, // AGENT SCRIPT A
    private readonly dcsCalculatorService: DcsCalculatorService, // GRAPH SCRIPT 09
    private readonly dcsHelper: DcsIntegrationHelper, // GRAPH SCRIPT 09
  ) {}

  /**
   * Main decision-making method (v2)
   * 
   * Evaluates signals and policies to determine the appropriate action.
   * Now uses propose/enforce pattern for better auditability.
   * 
   * SCRIPT 10: Added short-term caching to prevent spam
   */
  async makeDecision(input: DecisionInput): Promise<DecisionOutput> {
    // SCRIPT 10: Check cache first
    const cacheKey = this.getCacheKey(input);
    const cached = this.decisionCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      this.logger.debug(`Cache hit for decision: ${cacheKey}`);
      return cached.result;
    }

    this.logger.debug(
      `Evaluating decision for user ${input.userId}, session ${input.sessionId}`,
    );

    // 1. Fetch policies
    const policy = await this.fetchPolicy(input.userId);

    // 2. Calculate scaffolding level
    const scaffoldingLevel = await this.scaffoldingService.calculateFadingLevel(
      input.userId,
    );
    const multipliers = this.scaffoldingService.getThresholdMultipliers(scaffoldingLevel);

    // 3. Propose action based on heuristics
    const proposal = this.proposeAction(input.signals, policy, multipliers);

    // 4. Check budget
    const budgetExceeded = await this.checkBudgetExceeded(
      input.userId,
      policy.llmBudgetDailyTokens,
    );

    const budgetRemaining = await this.getBudgetRemaining(
      input.userId,
      policy.llmBudgetDailyTokens,
    );

    // GRAPH SCRIPT 09: Fetch DCS for content
    const dcsSnapshot = input.contentId
      ? await this.dcsHelper.fetchDcs(input.contentId, 'USER', input.userId)
      : { dcs: 0.0, w_det: 0.0, w_llm: 1.0 };

    this.logger.debug(
      `DCS snapshot: dcs=${dcsSnapshot.dcs.toFixed(3)}, w_det=${dcsSnapshot.w_det.toFixed(3)}, w_llm=${dcsSnapshot.w_llm.toFixed(3)}`,
    );

    // 5. Enforce constraints (policy, budget, phase, cooldown, DCS weighting)
    const resultV2 = await this.enforce(
      proposal,
      policy,
      budgetExceeded,
      scaffoldingLevel,
      !!input.signals.explicitUserAction,
      input.signals.flowState === 'LOW_FLOW',
      budgetRemaining,
      'POST', // TODO: Derive from session phase
      input.userId, // SCRIPT 10: Pass userId for intervention frequency check
      dcsSnapshot, // GRAPH SCRIPT 09: Pass DCS for weighting
      input.contentId, // GRAPH SCRIPT 09: For event logging
      input.sessionId, // GRAPH SCRIPT 09: For event logging
    );

    // 6. Log the decision (v2)
    await this.logRepository.logDecisionV2(resultV2, input);

    // 7. Emit telemetry for decision tracking
    if (resultV2.finalAction !== 'NO_OP') {
      await this.telemetryService.track({
        eventType: TelemetryEventType.DECISION_APPLIED,
        eventVersion: '2.0.0',
        contentId: input.contentId || 'unknown',
        sessionId: input.sessionId,
        data: {
          candidateAction: resultV2.candidateAction,
          finalAction: resultV2.finalAction,
          suppressed: resultV2.suppressed,
          suppressReasons: resultV2.suppressReasons,
          channel: resultV2.channelAfter,
        },
      }, input.userId);
    }

    this.logger.debug(
      `Decision made: ${resultV2.finalAction} via ${resultV2.channelAfter} (candidate: ${resultV2.candidateAction}, suppressed: ${resultV2.suppressed})`,
    );

    // Return legacy format for backward compatibility
    const result = {
      action: resultV2.finalAction,
      channel: resultV2.channelAfter,
      reason: proposal.reason,
      payload: resultV2.payload,
    };

    // SCRIPT 10: Cache the result
    this.decisionCache.set(cacheKey, { result, timestamp: Date.now() });
    
    // Clean old cache entries periodically (simple approach)
    if (this.decisionCache.size > 1000) {
      const now = Date.now();
      for (const [key, value] of this.decisionCache.entries()) {
        if (now - value.timestamp > this.CACHE_TTL_MS) {
          this.decisionCache.delete(key);
        }
      }
    }

    return result;
  }

  /**
   * SCRIPT 10: Generate cache key for decision
   */
  private getCacheKey(input: DecisionInput): string {
    return `${input.userId}:${input.sessionId}:${JSON.stringify(input.signals)}`;
  }

  /**
   * Propose action based on heuristics (pure decision logic)
   */
  private proposeAction(
    signals: DecisionInput['signals'],
    policy: DecisionPolicy,
    multipliers: { doubtSensitivity: number },
  ): { action: DecisionAction; channelHint: DecisionChannel; reason: DecisionReason; payload?: any } {
    // 0. Chat Context Analysis (Highest Priority for natural language)
    if (signals.chatContext?.text) {
      const text = signals.chatContext.text.trim();
      
      // 0a. Quick Reply Button Detection (Exact Match)
      const quickReplyAction = this.detectQuickReplyAction(text);
      if (quickReplyAction) {
        return this.handleExplicitActionProposal(quickReplyAction);
      }
      
      // 0b. Natural Language Intent Detection (Regex)
      const intent = this.detectChatIntent(text, signals.chatContext.hasSelection);
      
      if (intent === 'SENTENCE_ANALYSIS') {
        return this.handleExplicitActionProposal('USER_ASKS_SENTENCE_ANALYSIS');
      }
      
      // Fallback: Proactive discovery (Quick Replies) if text is substantial
      if (text.length > 10 && !signals.explicitUserAction) {
         return {
          action: 'ASK_PROMPT',
          channelHint: 'DETERMINISTIC',
          reason: 'USER_EXPLICIT_ASK',
          payload: { 
            promptType: 'discovery',
            message: 'Recebido. O que você gostaria de fazer com esse trecho?',
            quickReplies: [
              'Analisar Sintaxe',
              'Explicar Termos',
              'Analogia',
              'Morfologia',
              'Bridging',
              'Abstração'
            ]
          },
        };
      }
    }

    // Explicit user actions (highest priority)
    // 3. Check for specific user triggers (Action Shortcuts)
    if (signals.explicitUserAction) {
      if ((signals.explicitUserAction as string) === 'help') {
        return {
          action: 'ASK_PROMPT',
          reason: 'USER_EXPLICIT_ASK',
          channelHint: 'DETERMINISTIC',
          payload: { promptType: 'generic_help' },
        };
      }
      // If it's another explicit action, handle it generally
      return this.handleExplicitActionProposal(signals.explicitUserAction);
    }

    // 4. Check for LOW_FLOW state (Excessive Doubts)
    if (signals.flowState === 'LOW_FLOW' || (signals.doubtsInWindow || 0) > 3) {
      return {
        action: 'ASK_PROMPT',
        reason: 'DOUBT_SPIKE',
        channelHint: 'DETERMINISTIC',
        payload: { promptType: 'reflection', context: 'struggle_detected' },
      };
    }

    // Doubt spike (with scaffolding multiplier)
    if (this.isDoubtSpike(signals, policy, multipliers.doubtSensitivity)) {
      return {
        action: 'ASK_PROMPT',
        channelHint: 'DETERMINISTIC',
        reason: 'DOUBT_SPIKE',
        payload: { promptType: 'metacognitive', suggestedMission: 'HUGGING' },
      };
    }
    // Checkpoint failures
    else if (this.isCheckpointFail(signals, policy)) {
      return {
        action: 'ASSIGN_MISSION',
        channelHint: 'DETERMINISTIC',
        reason: 'CHECKPOINT_FAIL',
        payload: { missionType: 'BRIDGING', scaffoldingAction: 'UP' },
      };
    }
    // Low flow / erratic behavior
    else if (signals.flowState === 'ERRATIC') {
      return {
        action: 'NO_OP',
        channelHint: 'DETERMINISTIC',
        reason: 'LOW_FLOW',
        payload: { cooldownSeconds: 300 },
      };
    }
    // SCRIPT 08: Productive Failure trigger (low mastery + content has PF assets)
    else if (signals.lowMastery && signals.contentHasPFAssets) {
      return {
        action: 'ASSIGN_MISSION',
        channelHint: 'DETERMINISTIC',
        reason: 'LOW_MASTERY',
        payload: { missionType: 'PRODUCTIVE_FAILURE', scaffoldingAction: 'SUPPORT' },
      };
    }
    // Post-summary check
    else if (this.isSummaryPoor(signals)) {
      return {
        action: 'GUIDED_SYNTHESIS',
        channelHint: 'DETERMINISTIC',
        reason: 'POST_SUMMARY',
        payload: { rubricType: 'cornell_short', requiresLLM: false },
      };
    }
    // Default: no intervention
    else {
      return {
        action: 'NO_OP',
        channelHint: 'DETERMINISTIC',
        reason: 'NO_TRIGGER',
      };
    }
  }

  /**
   * Enforce constraints (policy, budget, phase, cooldown, DCS weighting)
   * Uses centralized suppression logic from decision.suppress.ts
   * 
   * SCRIPT 10: Now async to support intervention frequency check
   * GRAPH SCRIPT 09: Now applies DCS weighting to thresholds, budgets, and depth policy
   */
  private async enforce(
    proposal: { action: DecisionAction; channelHint: DecisionChannel; reason: DecisionReason; payload?: any },
    policy: DecisionPolicy,
    budgetExceeded: boolean,
    scaffoldingLevel: number,
    explicitAsk: boolean | undefined,
    lowFlow: boolean,
    budgetRemaining: number,
    phase: 'DURING' | 'POST' = 'POST',
    userId: string, // SCRIPT 10: Added for intervention frequency check
    dcsSnapshot?: { dcs: number; w_det: number; w_llm: number }, // GRAPH SCRIPT 09
    contentId?: string, // GRAPH SCRIPT 09
    sessionId?: string, // GRAPH SCRIPT 09
  ): Promise<DecisionResultV2> {
    const channelBefore = proposal.channelHint;
    let finalAction = proposal.action;
    let channelAfter = proposal.channelHint;
    let degradedCapability = false;

    // GRAPH SCRIPT 09: Apply DCS weighting
    const w_det = dcsSnapshot?.w_det || 0.0;
    const w_llm = dcsSnapshot?.w_llm || 1.0;

    // GRAPH SCRIPT 09: Check invisible mode suppression (DURING + high DCS)
    if (dcsSnapshot && this.dcsHelper.shouldSuppressInvisible(phase, !!explicitAsk, w_det)) {
      this.logger.debug(`DCS invisible mode: suppressing action (w_det=${w_det.toFixed(3)})`);
      finalAction = 'NO_OP';
      
      // Log DCS event
      if (contentId && sessionId) {
        await this.dcsHelper.logWeightEvent(
          sessionId,
          userId,
          contentId,
          dcsSnapshot.dcs,
          w_det,
          w_llm,
          proposal.action,
          true,
          'DCS_INVISIBLE_MODE',
        );
      }
    }

    // GRAPH SCRIPT 09: Check depth policy (action allowed based on w_det bucket)
    if (dcsSnapshot && !this.dcsHelper.isActionAllowed(finalAction, w_det)) {
      this.logger.debug(`DCS depth policy: action ${finalAction} not allowed (w_det=${w_det.toFixed(3)})`);
      finalAction = 'NO_OP';
      
      // Log DCS event
      if (contentId && sessionId) {
        await this.dcsHelper.logWeightEvent(
          sessionId,
          userId,
          contentId,
          dcsSnapshot.dcs,
          w_det,
          w_llm,
          proposal.action,
          true,
          'DCS_DEPTH_POLICY',
        );
      }
    }

    // Apply logic transforms (side-effects)
    // Phase DURING: suppress LLM actions if not explicit ask
    if (!explicitAsk && (finalAction === 'CALL_AI_SERVICE_EXTRACT' || finalAction === 'CALL_AGENT')) {
      finalAction = 'NO_OP';
    }

    // Low Flow: silence interventions
    if (lowFlow && finalAction !== 'NO_OP') {
      finalAction = 'NO_OP';
    }

    // L0 Fade: suppress optional interventions
    if (scaffoldingLevel === 0 && !explicitAsk && finalAction !== 'NO_OP') {
      finalAction = 'NO_OP';
    }

    // Policy: transfer disabled
    if (!policy.transferEnabled && finalAction !== 'NO_OP') {
      finalAction = 'NO_OP';
    }

    // SCRIPT 10: Max interventions per 10min (invisible by default)
    if (!explicitAsk && finalAction !== 'NO_OP') {
      const maxInterventions = this.scaffoldingService.getMaxInterventions(scaffoldingLevel as 0 | 1 | 2 | 3);
      const recentCount = await this.checkInterventionFrequency(userId, 10);
      
      if (recentCount >= maxInterventions) {
        this.logger.warn(
          `Max interventions exceeded for user ${userId}: ${recentCount}/${maxInterventions} in last 10min`,
        );
        finalAction = 'NO_OP';
      }
    }

    // ========================================================================
    // SCRIPT 03 - Fase 2: Scaffolding Signal Detection & Adjustment
    // ========================================================================
    
    // Only detect signals if we have required context
    if (contentId && userId) {
      try {
        // Get current scaffolding state
        const learnerProfile = await this.prisma.learner_profiles.findUnique({
          where: { user_id: userId },
          select: { scaffolding_state_json: true },
        });

        const scaffoldingState = learnerProfile?.scaffolding_state_json as any || {
          currentLevel: scaffoldingLevel,
          lastLevelChangeAt: new Date(),
          fadingMetrics: {
            consecutiveSuccesses: 0,
            interventionDismissalRate: 0,
          },
        };

        // Detect signal
        const signal = await this.scaffoldingSignalDetector.detectSignal(
          userId,
          contentId,
          await this.getContentMode(contentId),
          scaffoldingState,
        );

        // GAP 4: Check cooldown (5 minutes)
        const COOLDOWN_MS = 5 * 60 * 1000;
        const timeSinceLastChange = Date.now() - new Date(scaffoldingState.lastLevelChangeAt).getTime();
        const cooldownActive = timeSinceLastChange < COOLDOWN_MS;

        // Apply scaffolding adjustment if signal confidence is high and cooldown passed
        if (signal.type !== 'MAINTAIN' && signal.confidence > 0.7 && !cooldownActive) {
          const newLevel = this.calculateNewScaffoldingLevel(
            scaffoldingState.currentLevel,
            signal.type,
          );

          if (newLevel !== scaffoldingState.currentLevel) {
            this.logger.log(
              `Scaffolding adjustment: L${scaffoldingState.currentLevel} → L${newLevel} (reason: ${signal.reason}, confidence: ${signal.confidence.toFixed(2)})`,
            );

            // Update scaffolding level (GAP 5: handles consecutiveSuccesses)
            await this.scaffoldingService.updateLevel(
              userId,
              newLevel as ScaffoldingLevel,
              signal.reason,
              await this.getContentMode(contentId),
              signal.type,
            );

            // TODO: Emit SCAFFOLDING_LEVEL_SET event (will be added in next step)
          }
        } else if (signal.type !== 'MAINTAIN' && cooldownActive) {
          this.logger.debug(
            `Scaffolding change suppressed (cooldown): ${timeSinceLastChange}ms < ${COOLDOWN_MS}ms`,
          );
        }
      } catch (error) {
        this.logger.error('Failed to detect/apply scaffolding signal:', error);
        // Don't fail the entire decision if scaffolding detection fails
      }
    }

    // Budget: exceeded
    if (budgetExceeded) {
       if (finalAction === 'CALL_AI_SERVICE_EXTRACT' || finalAction === 'CALL_AGENT') {
          finalAction = 'NO_OP';
       } else if (channelBefore === 'LLM' || channelBefore === 'CACHED_LLM') {
          // Degrade channel
          channelAfter = 'DETERMINISTIC';
          degradedCapability = true;
       }
    }

    // Build suppression context
    const ctx: SuppressionContext = {
      phase,
      explicitAsk: !!explicitAsk,
      lowFlow,
      cooldownActive: false, // TODO: Implement cooldown tracking
      policyTransferEnabled: policy.transferEnabled,
      llmEnabled: true, // TODO: Add llmEnabled to policy if needed
      budgetExceeded,
      rateLimited: false, // TODO: Implement rate limiting
      missingInputs: false, // TODO: Implement input validation
      safetyGuardTriggered: false, // TODO: Implement safety guards
      degradedCapability,
    };

    // Compute suppression reasons using centralized helper
    const suppressReasons = computeSuppressReasons(ctx);
    const suppressed = isSuppressed(proposal.action, finalAction, suppressReasons);

    return {
      candidateAction: proposal.action,
      finalAction,
      suppressed,
      suppressReasons,
      channelBefore,
      channelAfter,
      payload: proposal.payload,
      policySnapshot: {
        transferEnabled: policy.transferEnabled,
        llmBudgetDailyTokens: policy.llmBudgetDailyTokens,
      },
      budgetRemainingTokens: budgetRemaining,
    };
  }

  /**
   * Get remaining budget tokens
   */
  private async getBudgetRemaining(
    userId: string,
    dailyBudget: number,
  ): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usage = await this.prisma.usage_events.aggregate({
      where: {
        user_id: userId,
        metric: 'llm_tokens',
        occurred_at: {
          gte: today,
        },
      },
      _sum: {
        quantity: true,
      },
    });

    const tokensUsed = usage._sum.quantity || 0;
    return Math.max(0, dailyBudget - tokensUsed);
  }

  /**
   * Helper to detect intent from chat text (Regex-based)
   */
  private detectChatIntent(text: string, hasSelection: boolean): 'SENTENCE_ANALYSIS' | null {
    if (!text) return null;
    
    // Regex for sentence analysis keywords
    const analysisRegex = /(analise|sintaxe|oração|sentence|structure|gramática|sujeito)/i;
    
    if (analysisRegex.test(text)) {
      // Guardrail: meaningful analysis usually requires a selection or context
      // But we allow if the text itself is "Analise esta frase: [texto]"
      // For now, allow trigger if regex matches
      return 'SENTENCE_ANALYSIS';
    }
    
    return null;
  }

  /**
   * Helper to map Quick Reply button text to explicitUserAction
   */
  private detectQuickReplyAction(text: string): string | null {
    // Exact match mapping (case-insensitive)
    const normalizedText = text.toLowerCase().trim();
    
    switch (normalizedText) {
      case 'analisar sintaxe':
        return 'USER_ASKS_SENTENCE_ANALYSIS';
      case 'explicar termos':
        return 'USER_ASKS_TIER2';
      case 'analogia':
        return 'USER_ASKS_ANALOGY';
      case 'morfologia':
        return 'USER_ASKS_MORPHOLOGY';
      case 'bridging':
        return 'USER_ASKS_BRIDGING';
      case 'abstração':
        return 'USER_ASKS_HIGH_ROAD';
      default:
        return null;
    }
  }

  /**
   * SCRIPT 10: Check intervention frequency (last N minutes)
   */
  private async checkInterventionFrequency(
    userId: string,
    minutes: number,
  ): Promise<number> {
    const since = new Date(Date.now() - minutes * 60 * 1000);

    const count = await this.prisma.decision_logs.count({
      where: {
        user_id: userId,
        created_at: { gte: since },
        final_action: { not: 'NO_OP' },
      },
    });

    return count;
  }
  
  /**
   * Execute Transfer Task (AGENT SCRIPT A)
   * 
   * Helper method to call the Transfer Graph with specific intent.
   * Used when DecisionService determines that an AI intervention is needed.
   * 
   * @param intent - The transfer intent (ANALOGY, MISSION_FEEDBACK, etc.)
   * @param context - Context data for the transfer task
   * @returns The AI-generated response
   */
  async executeTransferTask(
    intent: TransferIntent,
    context: {
      userId: string;
      sessionId: string;
      contentId: string;
      transferMetadata?: any;
      missionData?: any;
      userProfile?: any;
      scopeId?: string;
      scopeType?: 'family' | 'institution';
    },
  ): Promise<{ responseText: string; structuredOutput?: any }> {
    this.logger.debug(
      `Executing transfer task: intent=${intent}, session=${context.sessionId}`,
    );

    try {
      const result = await this.aiServiceClient.executeTransferTask(
        {
          intent,
          userId: context.userId,
          sessionId: context.sessionId,
          contentId: context.contentId,
          transferMetadata: context.transferMetadata,
          missionData: context.missionData,
          userProfile: context.userProfile,
        },
        {
          scopeId: context.scopeId,
          scopeType: context.scopeType,
        },
      );

      this.logger.debug(
        `Transfer task completed: intent=${intent}, tokens=${result.tokensUsed || 0}`,
      );

      return {
        responseText: result.responseText,
        structuredOutput: result.structuredOutput,
      };
    } catch (error) {
      this.logger.error(
        `Transfer task failed: intent=${intent}, error=${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Handle explicit action proposal
   */
  private handleExplicitActionProposal(
    action: string,
  ): { action: DecisionAction; channelHint: DecisionChannel; reason: DecisionReason; payload?: any } {
    switch (action) {
      case 'USER_ASKS_ANALOGY':
        return {
          action: 'ASSIGN_MISSION',
          channelHint: 'CACHED_LLM',
          reason: 'USER_EXPLICIT_ASK',
          payload: { missionType: 'ANALOGY' },
        };

      case 'CLICK_TIER2_HELP':
        return {
          action: 'ASK_PROMPT',
          channelHint: 'DETERMINISTIC',
          reason: 'USER_EXPLICIT_ASK',
          payload: { hintType: 'TIER2' },
        };

      case 'USER_ASKS_SENTENCE_ANALYSIS':
        return {
          action: 'CALL_AGENT',
          channelHint: 'CACHED_LLM',
          reason: 'USER_EXPLICIT_ASK',
          payload: { intent: 'SENTENCE_ANALYSIS' },
        };

      case 'USER_ASKS_TIER2':
        return {
          action: 'CALL_AGENT',
          channelHint: 'CACHED_LLM',
          reason: 'USER_EXPLICIT_ASK',
          payload: { intent: 'TIER2' },
        };

      case 'USER_ASKS_MORPHOLOGY':
        return {
          action: 'CALL_AGENT',
          channelHint: 'CACHED_LLM',
          reason: 'USER_EXPLICIT_ASK',
          payload: { intent: 'BRIDGING' },
        };

      case 'USER_ASKS_HIGH_ROAD':
        return {
          action: 'CALL_AGENT',
          channelHint: 'CACHED_LLM',
          reason: 'USER_EXPLICIT_ASK',
          payload: { intent: 'HIGH_ROAD' },
        };

      default:
        return {
          action: 'ASK_PROMPT',
          channelHint: 'DETERMINISTIC',
          reason: 'USER_EXPLICIT_ASK',
        };
    }
  }

  /**
   * Fetch policy configuration for the user
   */
  private async fetchPolicy(userId: string): Promise<DecisionPolicy> {
    // Get user's institution and family
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        learner_profiles: {
          select: {
            education_level: true,
          },
        },
      },
    });

    // Try to get institution policy first
    const institutionPolicy = await this.prisma.institution_policies.findFirst(
      {
        where: {
          // This would need proper institution_id from user context
          // For now, using defaults
        },
        select: {
          transfer_enabled: true,
          scaffolding_level_default: true,
          fading_enabled: true,
          llm_budget_daily_tokens: true,
          decision_policy_json: true,
        },
      },
    );

    // Try family policy
    const familyPolicy = await this.prisma.family_policies.findFirst({
      where: {
        // This would need proper family_id from user context
      },
      select: {
        scaffolding_level_default: true,
        fading_enabled: true,
        llm_budget_daily_tokens: true,
        decision_policy_json: true,
      },
    });

    // Merge policies (institution > family > defaults)
    const policy = institutionPolicy || familyPolicy;

    return {
      transferEnabled: institutionPolicy?.transfer_enabled ?? true,
      scaffoldingLevelDefault: policy?.scaffolding_level_default ?? 1,
      fadingEnabled: policy?.fading_enabled ?? true,
      llmBudgetDailyTokens: policy?.llm_budget_daily_tokens ?? 10000,
      decisionPolicyJson: (policy?.decision_policy_json as any) || {},
    };
  }

  /**
   * Check if daily LLM budget has been exceeded
   */
  private async checkBudgetExceeded(
    userId: string,
    dailyBudget: number,
  ): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usage = await this.prisma.usage_events.aggregate({
      where: {
        user_id: userId,
        metric: 'llm_tokens',
        occurred_at: {
          gte: today,
        },
      },
      _sum: {
        quantity: true,
      },
    });

    const tokensUsed = usage._sum.quantity || 0;
    return tokensUsed >= dailyBudget;
  }

  /**
   * Handle explicit user actions
   */
  private handleExplicitAction(
    action: string,
    budgetExceeded: boolean,
  ): DecisionOutput {
    switch (action) {
      case 'USER_ASKS_ANALOGY':
        // Prefer deterministic metadata, use LLM only if missing and budget allows
        return this.createDecision(
          'ASSIGN_MISSION',
          budgetExceeded ? 'DETERMINISTIC' : 'CACHED_LLM',
          'USER_EXPLICIT_ASK',
          { missionType: 'ANALOGY' },
        );

      case 'CLICK_TIER2_HELP':
        return this.createDecision(
          'ASK_PROMPT',
          'DETERMINISTIC',
          'USER_EXPLICIT_ASK',
          { hintType: 'TIER2' },
        );

      default:
        return this.createDecision(
          'ASK_PROMPT',
          'DETERMINISTIC',
          'USER_EXPLICIT_ASK',
        );
    }
  }

  /**
   * Check if there's a doubt spike
   */
  private isDoubtSpike(
    signals: DecisionInput['signals'],
    policy: DecisionPolicy,
    multiplier: number = 1.0,
  ): boolean {
    const baseThreshold = policy.decisionPolicyJson?.doubtThreshold ?? 3;
    const adjustedThreshold = baseThreshold * multiplier;
    return signals.doubtsInWindow >= adjustedThreshold;
  }

  /**
   * Handle doubt spike
   */
  private handleDoubtSpike(): DecisionOutput {
    return this.createDecision(
      'ASK_PROMPT',
      'DETERMINISTIC',
      'DOUBT_SPIKE',
      {
        promptType: 'metacognitive',
        suggestedMission: 'HUGGING',
      },
    );
  }

  /**
   * Check if checkpoint failures threshold is met
   */
  private isCheckpointFail(
    signals: DecisionInput['signals'],
    policy: DecisionPolicy,
  ): boolean {
    const threshold = policy.decisionPolicyJson?.checkpointFailThreshold ?? 2;
    return signals.checkpointFailures >= threshold;
  }

  /**
   * Handle checkpoint failures
   */
  private handleCheckpointFail(): DecisionOutput {
    return this.createDecision(
      'ASSIGN_MISSION',
      'DETERMINISTIC',
      'CHECKPOINT_FAIL',
      {
        missionType: 'BRIDGING', // or PRODUCTIVE_FAILURE
        scaffoldingAction: 'UP', // Signal to SCRIPT 05
      },
    );
  }

  /**
   * Handle low flow / erratic behavior
   */
  private handleLowFlow(): DecisionOutput {
    return this.createDecision('NO_OP', 'DETERMINISTIC', 'LOW_FLOW', {
      cooldownSeconds: 300, // 5 minutes
    });
  }

  /**
   * Check if summary quality is poor
   */
  private isSummaryPoor(signals: DecisionInput['signals']): boolean {
    return (
      signals.summaryQuality === 'EMPTY' ||
      signals.summaryQuality === 'SHORT'
    );
  }

  /**
   * Handle poor summary quality
   */
  private handlePoorSummary(): DecisionOutput {
    return this.createDecision(
      'GUIDED_SYNTHESIS',
      'DETERMINISTIC',
      'POST_SUMMARY',
      {
        rubricType: 'cornell_short',
        requiresLLM: false,
      },
    );
  }

  /**
   * Helper to create decision output
   */
  private createDecision(
    action: DecisionAction,
    channel: DecisionChannel,
    reason: DecisionReason,
    payload?: any,
  ): DecisionOutput {
    return {
      action,
      channel,
      reason,
      payload,
    };
  }

  /**
   * Evaluate if LLM fallback is allowed for metadata extraction
   * 
   * PATCH 04v2: Controls LLM usage for backend tasks
   * 
   * Rules:
   * - transfer_enabled must be true
   * - budget must not be exceeded
   * - phase must be POST (DURING is strictly deterministic to avoid "chatty" behavior)
   */
  async evaluateExtractionPolicy(
    userId: string,
    phase: 'DURING' | 'POST' = 'POST',
    context?: { contentId?: string; sessionId?: string },
  ): Promise<{
    allowed: boolean;
    caps: { maxTokens: number; modelTier: string };
    reason?: string;
  }> {
    // 1. Fetch policies
    const policy = await this.fetchPolicy(userId);

    // 2. Prepare v2 result tracking
    const candidateAction: DecisionAction = 'CALL_AI_SERVICE_EXTRACT';
    const channelBefore: DecisionChannel = 'LLM';
    let finalAction: DecisionAction = 'CALL_AI_SERVICE_EXTRACT';
    let channelAfter: DecisionChannel = 'LLM';
    let suppressed = false;
    const suppressReasons: SuppressReason[] = [];

    // 3. Check transfer enabled
    if (!policy.transferEnabled) {
      finalAction = 'NO_OP';
      suppressed = true;
      suppressReasons.push(SuppressReason.POLICY_DISABLED);
    }

    // 4. Check budget (only if not already suppressed)
    const budgetExceeded = await this.checkBudgetExceeded(
      userId,
      policy.llmBudgetDailyTokens,
    );
    const budgetRemaining = await this.getBudgetRemaining(userId, policy.llmBudgetDailyTokens);

    if (budgetExceeded && !suppressed) {
      finalAction = 'NO_OP';
      suppressed = true;
      suppressReasons.push(SuppressReason.BUDGET_EXCEEDED);
    }

    // 5. Check phase (DURING = invisible by default) (only if not already suppressed)
    if (phase === 'DURING' && !suppressed) {
      finalAction = 'NO_OP';
      suppressed = true;
      suppressReasons.push(SuppressReason.PHASE_DURING_INVISIBLE);
    }

    // 6. Log the decision (v2)
    const resultV2: DecisionResultV2 = {
      candidateAction,
      finalAction,
      suppressed,
      suppressReasons,
      channelBefore,
      channelAfter: suppressed ? 'DETERMINISTIC' : 'LLM',
      payload: { phase, caps: suppressed ? null : { maxTokens: 1000, modelTier: 'flash' } },
      policySnapshot: {
        transferEnabled: policy.transferEnabled,
        llmBudgetDailyTokens: policy.llmBudgetDailyTokens,
      },
      budgetRemainingTokens: budgetRemaining,
    };

    const logInput: DecisionInput = {
      userId,
      sessionId: context?.sessionId || 'background-extraction',
      contentId: context?.contentId || 'unknown',
      uiPolicyVersion: '1.0.0', // Standard version
      signals: {
        doubtsInWindow: 0,
        checkpointFailures: 0,
        flowState: 'FLOW',
        summaryQuality: 'OK',
      },
    };

    await this.logRepository.logDecisionV2(resultV2, logInput);

    // Map suppression reasons to legacy return format
    if (suppressed) {
      let legacyReason = 'policy';
      if (suppressReasons.includes(SuppressReason.BUDGET_EXCEEDED)) legacyReason = 'budget';
      else if (suppressReasons.includes(SuppressReason.PHASE_DURING_INVISIBLE)) legacyReason = 'phase';

      return {
        allowed: false,
        caps: { maxTokens: 0, modelTier: 'none' },
        reason: legacyReason,
      };
    }

    // All checks passed
    return {
      allowed: true,
      caps: {
        maxTokens: 1000, // Conservative limit for metadata extraction
        modelTier: 'flash', // Use fast, cheap model
      },
    };
  }

  // ========================================================================
  // SCRIPT 03 - Fase 2: Scaffolding Helper Methods
  // ========================================================================

  /**
   * Get ContentMode for a given content
   */
  private async getContentMode(contentId: string): Promise<any> {
    const content = await this.prisma.contents.findUnique({
      where: { id: contentId },
      select: { mode: true },
    });
    return content?.mode || 'DIDACTIC';
  }

  /**
   * Calculate new scaffolding level based on signal type
   */
  private calculateNewScaffoldingLevel(
    currentLevel: number,
    signalType: 'INCREASE' | 'DECREASE' | 'MAINTAIN',
  ): number {
    if (signalType === 'INCREASE') {
      return Math.min(3, currentLevel + 1);
    } else if (signalType === 'DECREASE') {
      return Math.max(0, currentLevel - 1);
    }
    return currentLevel;
  }
}
