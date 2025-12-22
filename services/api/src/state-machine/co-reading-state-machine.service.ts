import { Injectable, Logger } from '@nestjs/common';
import { FamilyEventService } from '../events/family-event.service';
import { CoReadingPhase, CoReadingContext, PhaseTransitionResult } from './types';

@Injectable()
export class CoReadingStateMachine {
  private readonly logger = new Logger(CoReadingStateMachine.name);
  private readonly PRE_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

  constructor(private familyEventService: FamilyEventService) {}

  /**
   * Validate if a phase transition is allowed
   */
  private canTransition(from: CoReadingPhase, to: CoReadingPhase): boolean {
    const validTransitions: Record<CoReadingPhase, CoReadingPhase[]> = {
      [CoReadingPhase.BOOT]: [CoReadingPhase.PRE],
      [CoReadingPhase.PRE]: [CoReadingPhase.DURING],
      [CoReadingPhase.DURING]: [CoReadingPhase.POST],
      [CoReadingPhase.POST]: [CoReadingPhase.CLOSE],
      [CoReadingPhase.CLOSE]: [], // Terminal state
    };

    return validTransitions[from]?.includes(to) ?? false;
  }

  /**
   * Transition to a new phase
   */
  async transition(
    context: CoReadingContext,
    targetPhase: CoReadingPhase,
  ): Promise<PhaseTransitionResult> {
    const { currentPhase, coSessionId, readingSessionId, educatorUserId } = context;

    // Validate transition
    if (!this.canTransition(currentPhase, targetPhase)) {
      this.logger.warn(
        `Invalid transition: ${currentPhase} -> ${targetPhase} for session ${coSessionId}`,
      );
      return {
        success: false,
        newPhase: currentPhase,
        message: `Cannot transition from ${currentPhase} to ${targetPhase}`,
      };
    }

    // Log phase change event
    await this.familyEventService.logCoSessionPhaseChanged(
      readingSessionId,
      educatorUserId,
      {
        domain: 'FAMILY',
        type: 'CO_SESSION_PHASE_CHANGED',
        data: {
          coSessionId,
          phase: targetPhase,
        },
      },
    );

    this.logger.log(
      `Phase transition: ${currentPhase} -> ${targetPhase} for session ${coSessionId}`,
    );

    return {
      success: true,
      newPhase: targetPhase,
      nextPromptKey: this.getNextPromptKey(targetPhase, context),
    };
  }

  /**
   * Get the next prompt key based on current phase and context
   */
  private getNextPromptKey(
    phase: CoReadingPhase,
    context: CoReadingContext,
  ): string {
    switch (phase) {
      case CoReadingPhase.BOOT:
        return 'OPS_DAILY_BOOT_LEARNER';
      case CoReadingPhase.PRE:
        return 'READ_PRE_CHOICE_SKIM';
      case CoReadingPhase.DURING:
        return 'READ_DURING_MARK_RULE';
      case CoReadingPhase.POST:
        return 'READ_POST_FREE_RECALL';
      case CoReadingPhase.CLOSE:
        return 'EDU_CLOSE_SCRIPT';
      default:
        return 'OPS_QUEUE_NEXT';
    }
  }

  /**
   * Check if PRE phase has timed out (2 min)
   */
  hasPreTimedOut(context: CoReadingContext): boolean {
    if (context.currentPhase !== CoReadingPhase.PRE) {
      return false;
    }

    const elapsed = Date.now() - context.phaseStartedAt.getTime();
    return elapsed > this.PRE_TIMEOUT_MS;
  }

  /**
   * Check if DURING phase has exceeded timebox
   */
  hasDuringTimedOut(context: CoReadingContext): boolean {
    if (context.currentPhase !== CoReadingPhase.DURING) {
      return false;
    }

    const timeboxMs = context.timeboxMin * 60 * 1000;
    const elapsed = Date.now() - context.startedAt.getTime();
    return elapsed > timeboxMs;
  }

  /**
   * Handle checkpoint failure (increment counter, trigger intervention if needed)
   */
  async handleCheckpointFail(
    context: CoReadingContext,
  ): Promise<{ shouldIntervene: boolean; count: number }> {
    const newCount = context.checkpointFailCount + 1;

    // Trigger intervention after 2 consecutive failures
    if (newCount >= 2) {
      this.logger.log(
        `Checkpoint failed 2x for session ${context.coSessionId}, triggering intervention`,
      );
      return { shouldIntervene: true, count: newCount };
    }

    return { shouldIntervene: false, count: newCount };
  }

  /**
   * Boot phase: Daily goal setting
   */
  async boot(context: CoReadingContext): Promise<PhaseTransitionResult> {
    // Boot is completed when learner sets meta + why
    // Transition to PRE when ready
    return this.transition(context, CoReadingPhase.PRE);
  }

  /**
   * PRE phase: Skim, target words approval
   */
  async pre(context: CoReadingContext): Promise<PhaseTransitionResult> {
    // Check timeout
    if (this.hasPreTimedOut(context)) {
      this.logger.log(`PRE timeout for session ${context.coSessionId}, offering skip`);
      // Offer "Ir direto" quickReply
    }

    // PRE completes when targetWords approved
    return this.transition(context, CoReadingPhase.DURING);
  }

  /**
   * DURING phase: Reading blocks with checkpoints
   */
  async during(context: CoReadingContext): Promise<PhaseTransitionResult> {
    // Check timebox
    if (this.hasDuringTimedOut(context)) {
      this.logger.log(
        `Timebox exceeded for session ${context.coSessionId}, forcing POST`,
      );
      return this.transition(context, CoReadingPhase.POST);
    }

    // DURING completes when learner says "Terminei" or timebox reached
    return this.transition(context, CoReadingPhase.POST);
  }

  /**
   * POST phase: Recall, vocab usage, metacog
   */
  async post(context: CoReadingContext): Promise<PhaseTransitionResult> {
    // POST completes after metacog + educator closure
    return this.transition(context, CoReadingPhase.CLOSE);
  }

  /**
   * CLOSE phase: Finalize session, update snapshots
   */
  async close(context: CoReadingContext): Promise<PhaseTransitionResult> {
    // Log final event
    await this.familyEventService.logCoSessionFinished(
      context.readingSessionId,
      context.educatorUserId,
      {
        domain: 'FAMILY',
        type: 'CO_SESSION_FINISHED',
        data: {
          coSessionId: context.coSessionId,
          result: 'COMPLETED',
          durationMin: Math.round(
            (Date.now() - context.startedAt.getTime()) / 60000,
          ),
          summary: {
            targetWordsCount: 0, // TODO: Get from session data
            checkpointCount: 0,
            checkpointFailCount: context.checkpointFailCount,
            productionSubmitted: true,
          },
        },
      },
    );

    return {
      success: true,
      newPhase: CoReadingPhase.CLOSE,
      message: 'Session completed',
    };
  }
}
