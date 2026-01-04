import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  MasteryState,
  ScaffoldingState,
  ScaffoldingLevel,
  ScaffoldingConfig,
  MasterySignal,
} from '../domain/scaffolding.types';

/**
 * ScaffoldingService
 * 
 * Implements the Scaffolding & Fading engine.
 * Manages learner mastery state and determines appropriate scaffolding level (L0-L3).
 * 
 * Etapa 2 — Regras de Scaffolding (níveis 0–3)
 * Etapa 3 — Motor de Fading
 */
@Injectable()
export class ScaffoldingService {
  private readonly logger = new Logger(ScaffoldingService.name);

  // Thresholds for fading
  private readonly MASTERY_THRESHOLD_FADE = 0.8; // L0
  private readonly MASTERY_THRESHOLD_LOW = 0.6; // L1
  private readonly MASTERY_THRESHOLD_MEDIUM = 0.4; // L2
  private readonly CONSISTENCY_SESSIONS_REQUIRED = 3; // X sessions for fading

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get scaffolding configuration for a given level
   * Etapa 2 — Regras de Scaffolding (níveis 0–3)
   */
  getScaffoldingConfig(level: ScaffoldingLevel): ScaffoldingConfig {
    const configs: Record<ScaffoldingLevel, ScaffoldingConfig> = {
      3: {
        level: 3,
        name: 'High',
        behavior: 'Guided',
        rules: {
          doubtSpikeMultiplier: 1.0, // Sensitive
          checkpointFreqMultiplier: 1.0, // Frequent
          autoHints: true,
          socraticMode: true,
          showTriggers: false,
          minAgentCalls: false,
        },
      },
      2: {
        level: 2,
        name: 'Medium',
        behavior: 'Hints',
        rules: {
          doubtSpikeMultiplier: 1.5,
          checkpointFreqMultiplier: 0.8,
          autoHints: 'limited', // 1 Tier2 at a time
          socraticMode: false,
          showTriggers: false,
          minAgentCalls: false,
        },
      },
      1: {
        level: 1,
        name: 'Low',
        behavior: 'On-Demand',
        rules: {
          doubtSpikeMultiplier: 2.0, // Tolerant
          checkpointFreqMultiplier: 0.5, // Less frequent
          autoHints: false, // User must click
          socraticMode: false,
          showTriggers: true,
          minAgentCalls: false,
        },
      },
      0: {
        level: 0,
        name: 'Fade',
        behavior: 'Invisible',
        rules: {
          doubtSpikeMultiplier: 99.0, // Virtually off
          checkpointFreqMultiplier: 0.2, // Post-read only
          autoHints: false,
          socraticMode: false,
          showTriggers: false,
          minAgentCalls: true,
        },
      },
    };

    return configs[level];
  }

  /**
   * SCRIPT 10: Get max interventions per 10 minutes for a scaffolding level
   * Implements "invisible by default" principle
   */
  getMaxInterventions(level: ScaffoldingLevel): number {
    const limits: Record<ScaffoldingLevel, number> = {
      0: 0, // Invisible - no automatic interventions
      1: 1, // Minimal - very rare interventions
      2: 3, // Standard - moderate interventions
      3: 5, // High Support - frequent interventions
    };

    return limits[level];
  }

  /**
   * Calculate fading level based on mastery state
   * Etapa 3 — Motor de Fading
   */
  async calculateFadingLevel(
    userId: string,
    context?: { domain?: string },
  ): Promise<ScaffoldingLevel> {
    const profile = await this.prisma.learner_profiles.findUnique({
      where: { user_id: userId },
      select: {
        mastery_state_json: true,
        scaffolding_state_json: true,
      },
    });

    if (!profile) {
      this.logger.warn(`No profile found for user ${userId}, defaulting to L3`);
      return 3; // Default to high scaffolding
    }

    const masteryState = (profile.mastery_state_json as any) as MasteryState;
    const scaffoldingState = (profile.scaffolding_state_json as any) as ScaffoldingState;

    // If override is set, respect it
    if (scaffoldingState?.overrideMode === 'FORCE_HIGH') return 3;
    if (scaffoldingState?.overrideMode === 'FORCE_LOW') return 1;

    // Determine mastery score for context
    let masteryScore = 0;
    let consistencyCount = 0;

    if (context?.domain && masteryState?.domains?.[context.domain]) {
      const domainMastery = masteryState.domains[context.domain];
      masteryScore = domainMastery.mastery;
      consistencyCount = domainMastery.consistencyCount || 0;
    } else if (masteryState?.domains) {
      // Average across all domains
      const domainValues = Object.values(masteryState.domains);
      if (domainValues.length > 0) {
        masteryScore =
          domainValues.reduce((sum, d) => sum + d.mastery, 0) / domainValues.length;
        consistencyCount = Math.min(
          ...domainValues.map((d) => d.consistencyCount || 0),
        );
      }
    }

    // Apply fading rules
    if (
      masteryScore >= this.MASTERY_THRESHOLD_FADE &&
      consistencyCount >= this.CONSISTENCY_SESSIONS_REQUIRED
    ) {
      return 0; // Fade
    }

    if (masteryScore >= this.MASTERY_THRESHOLD_LOW) {
      return 1; // Low
    }

    if (masteryScore >= this.MASTERY_THRESHOLD_MEDIUM) {
      return 2; // Medium
    }

    return 3; // High (default for low mastery)
  }

  /**
   * Get threshold multipliers for DecisionService
   * Etapa 4 — Integração
   */
  getThresholdMultipliers(level: ScaffoldingLevel): {
    doubtSensitivity: number;
    checkpointFrequency: number;
  } {
    const config = this.getScaffoldingConfig(level);
    return {
      doubtSensitivity: config.rules.doubtSpikeMultiplier,
      checkpointFrequency: config.rules.checkpointFreqMultiplier,
    };
  }

  /**
   * Update mastery state based on a signal
   * This is called when learner completes activities
   */
  async updateMastery(userId: string, signal: MasterySignal): Promise<void> {
    const profile = await this.prisma.learner_profiles.findUnique({
      where: { user_id: userId },
      select: {
        mastery_state_json: true,
        scaffolding_state_json: true,
      },
    });

    if (!profile) {
      this.logger.warn(`No profile found for user ${userId}, skipping mastery update`);
      return;
    }

    const masteryState = (profile.mastery_state_json as any) as MasteryState || {
      domains: {},
      tier2: {},
      morphology: {},
    };

    const scaffoldingState = (profile.scaffolding_state_json as any) as ScaffoldingState;
    
    // Ensure nested structures are initialized
    const updatedScaffoldingState: ScaffoldingState = {
      currentLevel: scaffoldingState?.currentLevel ?? 3,
      lastLevelChangeAt: scaffoldingState?.lastLevelChangeAt ?? new Date(),
      fadingMetrics: {
        consecutiveSuccesses: scaffoldingState?.fadingMetrics?.consecutiveSuccesses ?? 0,
        interventionDismissalRate: scaffoldingState?.fadingMetrics?.interventionDismissalRate ?? 0,
      },
      overrideMode: scaffoldingState?.overrideMode,
    };

    // Update mastery based on signal type
    if (signal.domain) {
      if (!masteryState.domains[signal.domain]) {
        masteryState.domains[signal.domain] = {
          mastery: 0.5,
          lastEvidenceAt: signal.timestamp.toISOString(),
          missionHistory: {},
          consistencyCount: 0,
        };
      }

      const domain = masteryState.domains[signal.domain];

      // Adjust mastery based on signal
      if (signal.type === 'quiz_correct' || signal.type === 'checkpoint_passed') {
        domain.mastery = Math.min(1.0, domain.mastery + 0.05);
        domain.consistencyCount += 1;
        updatedScaffoldingState.fadingMetrics.consecutiveSuccesses += 1;
      } else if (signal.type === 'quiz_incorrect' || signal.type === 'checkpoint_failed') {
        domain.mastery = Math.max(0.0, domain.mastery - 0.03);
        domain.consistencyCount = 0; // Reset consistency
        updatedScaffoldingState.fadingMetrics.consecutiveSuccesses = 0;
      }

      domain.lastEvidenceAt = signal.timestamp.toISOString();
    }

    // Update tier2 mastery
    if (signal.tier2Term) {
      if (!masteryState.tier2[signal.tier2Term]) {
        masteryState.tier2[signal.tier2Term] = 0.5;
      }

      if (signal.type === 'quiz_correct') {
        masteryState.tier2[signal.tier2Term] = Math.min(
          1.0,
          masteryState.tier2[signal.tier2Term] + 0.1,
        );
      }
    }

    // Persist updated state
    await this.prisma.learner_profiles.update({
      where: { user_id: userId },
      data: {
        mastery_state_json: masteryState as any,
        scaffolding_state_json: updatedScaffoldingState as any,
        updated_at: new Date(),
      },
    });

    this.logger.debug(`Updated mastery for user ${userId}: ${signal.type}`);
  }

  /**
   * Update mastery from assessment results
   * SCRIPT 08 - Step 3: Mastery & Telemetry
   * 
   * @param userId - The user ID
   * @param assessmentAttemptId - The assessment attempt ID
   */
  async updateMasteryFromAssessment(
    userId: string,
    assessmentAttemptId: string,
  ): Promise<void> {
    this.logger.debug(`Updating mastery from assessment ${assessmentAttemptId} for user ${userId}`);

    // 1. Fetch assessment attempt with score
    const attempt = await this.prisma.assessment_attempts.findUnique({
      where: { id: assessmentAttemptId },
      include: {
        assessments: {
          include: {
            contents: true,
            assessment_questions: true,
          },
        },
        assessment_answers: true,
      },
    });

    if (!attempt || !attempt.score_percent) {
      this.logger.warn(`Assessment attempt ${assessmentAttemptId} not found or has no score`);
      return;
    }

    const scorePercent = attempt.score_percent;
    const contentMode = attempt.assessments.contents.mode;

    // 2. Fetch current mastery state
    const profile = await this.prisma.learner_profiles.findUnique({
      where: { user_id: userId },
    });

    if (!profile) {
      this.logger.warn(`Learner profile not found for user ${userId}`);
      return;
    }

    const masteryState = (profile.mastery_state_json as any) as MasteryState || {
      domains: {},
      tier2: {},
      errorPatterns: [],
    };

    const scaffoldingState = (profile.scaffolding_state_json as any) as ScaffoldingState || {
      currentLevel: 3,
      lastLevelChangeAt: new Date(),
      fadingMetrics: {
        consecutiveSuccesses: 0,
        interventionDismissalRate: 0,
      },
    };

    // 3. Determine domain from content mode
    const domain = contentMode || 'GENERAL';

    // Initialize domain if not exists
    if (!masteryState.domains[domain]) {
      masteryState.domains[domain] = {
        mastery: 0.5,
        lastEvidenceAt: new Date().toISOString(),
        missionHistory: {},
        consistencyCount: 0,
      };
    }

    const domainState = masteryState.domains[domain];

    // 4. Update mastery based on score
    if (scorePercent >= 80) {
      // High score: increment mastery
      domainState.mastery = Math.min(1.0, domainState.mastery + 0.1);
      domainState.consistencyCount += 1;
      scaffoldingState.fadingMetrics.consecutiveSuccesses += 1;
      this.logger.log(`User ${userId} scored ${scorePercent}% - mastery increased to ${domainState.mastery}`);
    } else if (scorePercent < 50) {
      // Low score: log error patterns
      domainState.mastery = Math.max(0.0, domainState.mastery - 0.05);
      domainState.consistencyCount = 0;
      scaffoldingState.fadingMetrics.consecutiveSuccesses = 0;

      // Extract error patterns from incorrect answers
      const incorrectAnswers = attempt.assessment_answers.filter(
        (answer) => {
          const question = attempt.assessments.assessment_questions.find(
            (q) => q.id === answer.question_id,
          );
          if (!question) return false;
          
          // Compare answer with correct_answer (handle JSON comparison)
          const userAnswer = answer.user_answer;
          const correctAnswer = question.correct_answer;
          
          return JSON.stringify(userAnswer) !== JSON.stringify(correctAnswer);
        },
      );

      // Log error patterns
      if (!masteryState.errorPatterns) {
        masteryState.errorPatterns = [];
      }

      for (const incorrectAnswer of incorrectAnswers) {
        const question = attempt.assessments.assessment_questions.find(
          (q) => q.id === incorrectAnswer.question_id,
        );

        if (question) {
          masteryState.errorPatterns.push({
            topic: domain,
            questionType: question.question_type,
            errorCount: 1,
            lastOccurrence: new Date().toISOString(),
            questionText: question.question_text.substring(0, 100), // First 100 chars
          });
        }
      }

      // Limit error patterns to last 20
      if (masteryState.errorPatterns.length > 20) {
        masteryState.errorPatterns = masteryState.errorPatterns.slice(-20);
      }

      this.logger.log(
        `User ${userId} scored ${scorePercent}% - mastery decreased to ${domainState.mastery}, logged ${incorrectAnswers.length} error patterns`,
      );
    } else {
      // Medium score: minor adjustment
      domainState.mastery = Math.max(0.0, domainState.mastery - 0.02);
      this.logger.log(`User ${userId} scored ${scorePercent}% - mastery slightly decreased to ${domainState.mastery}`);
    }

    domainState.lastEvidenceAt = new Date().toISOString();

    // 5. Persist updated state
    await this.prisma.learner_profiles.update({
      where: { user_id: userId },
      data: {
        mastery_state_json: masteryState as any,
        scaffolding_state_json: scaffoldingState as any,
        updated_at: new Date(),
      },
    });

    this.logger.log(`Mastery updated for user ${userId} from assessment ${assessmentAttemptId}`);
  }
}
