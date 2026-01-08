import { Injectable, Logger } from "@nestjs/common";
import { PromptLibraryService } from "../../prompts/prompt-library.service";
import { GamificationService } from "../../gamification/gamification.service";
import { SrsService } from "../../srs/srs.service";
import { PromptContext } from "../../prompts/types/prompt-context";
import { PrismaService } from "../../prisma/prisma.service";
import { ScaffoldingInitializerService } from "../../decision/application/scaffolding-initializer.service"; // SCRIPT 03
import { ScaffoldingBehaviorAdapterService } from "../../decision/application/scaffolding-behavior-adapter.service"; // SCRIPT 03 - Fase 3

@Injectable()
export class OpsCoachService {
  private readonly logger = new Logger(OpsCoachService.name);

  constructor(
    private promptLibrary: PromptLibraryService,
    private gamificationService: GamificationService,
    private srsService: SrsService,
    private prisma: PrismaService,
    private scaffoldingInitializer: ScaffoldingInitializerService, // SCRIPT 03
    private scaffoldingBehaviorAdapter: ScaffoldingBehaviorAdapterService, // SCRIPT 03 - Fase 3
  ) {}

  /**
   * Get daily boot prompt for learner based on session phase
   * @param phase - Optional session phase (BOOT, PRE, DURING, POST, FINISHED)
   * @returns Appropriate prompt for the given phase
   */
  getDailyBootLearner(phase?: 'BOOT' | 'PRE' | 'DURING' | 'POST' | 'FINISHED') {
    // Default to BOOT phase if not specified (backward compatibility)
    if (!phase || phase === 'BOOT') {
      return this.promptLibrary.getPrompt("OPS_DAILY_BOOT_LEARNER");
    }

    // Map phases to their corresponding prompts
    const promptKeys = {
      PRE: "READ_PRE_CHOICE_SKIM",
      DURING: "READ_DURING_MARK_RULE",
      POST: "READ_POST_FREE_RECALL",
      FINISHED: "READ_FINISHED_SUMMARY",
    };

    const promptKey = promptKeys[phase];
    if (!promptKey) {
      throw new Error(`No prompt defined for phase: ${phase}`);
    }

    return this.promptLibrary.getPrompt(promptKey);
  }

  /**
   * Get daily boot prompt with context (for all phases)
   * @param phase - Session phase
   * @param userId - User ID for fetching gamification data
   * @param sessionId - Session ID for context building
   * @param contentId - Optional content ID for SRS calculation
   * @returns Prompt with interpolated variables
   */
  async getDailyBootLearnerWithContext(
    phase: 'BOOT' | 'PRE' | 'DURING' | 'POST' | 'FINISHED',
    userId: string,
    sessionId: string,
    contentId?: string,
  ) {
    const basePrompt = this.getDailyBootLearner(phase);

    // Interpolate for all phases
    // if (phase !== 'FINISHED' && phase !== 'BOOT') {
    //   return basePrompt;
    // }

    try {
      // Use buildSessionContext helper
      const { buildSessionContext } = await import(
        '../../sessions/helpers/context-builder'
      );

      const context = await buildSessionContext(
        sessionId,
        userId,
        contentId || '',
        {
          prisma: this.prisma,
          gamificationService: this.gamificationService,
          scaffoldingInitializer: this.scaffoldingInitializer, // SCRIPT 03
          scaffoldingBehaviorAdapter: this.scaffoldingBehaviorAdapter, // SCRIPT 03 - Fase 3
        },
      );

      return this.promptLibrary.interpolateVariables(basePrompt, context);
    } catch (error) {
      // Fallback to base prompt if context building fails
      this.logger.error('Failed to build prompt context:', error);
      return basePrompt;
    }
  }

  /**
   * Calculate days until next review using simplified SRS logic
   */
  private async calculateNextReview(
    userId: string,
    contentId?: string,
  ): Promise<number> {
    if (!contentId) {
      return 3; // Default: 3 days
    }

    // TODO: Query vocab items for this content and get earliest due date
    // For now, use simple heuristic based on SRS intervals
    const defaultStage = 'D3'; // Assume D3 stage for new content
    const interval = this.srsService.getStageInterval(defaultStage as any);
    
    return interval;
  }

  /**
   * Get daily boot prompt for educator (co-reading reminder)
   */
  getDailyBootEducator(coReadingDays: number[]) {
    const today = new Date().getDay(); // 0-6 (Sun-Sat)
    const isCoReadingDay = coReadingDays.includes(today);

    if (isCoReadingDay) {
      return this.promptLibrary.getPrompt("OPS_DAILY_BOOT_EDUCATOR", {
        DAYS: "hoje",
      });
    }

    return null; // No reminder if not a co-reading day
  }

  /**
   * Get queue next item prompt
   */
  getQueueNext(title: string, estMin: number) {
    return this.promptLibrary.getPrompt("OPS_QUEUE_NEXT", {
      TITLE: title,
      MIN: estMin,
    });
  }

  /**
   * Get time log prompt
   */
  getTimeLogPrompt() {
    return this.promptLibrary.getPrompt("OPS_TIME_LOG");
  }

  /**
   * Get daily close prompt for learner
   */
  getDailyCloseLearner() {
    return this.promptLibrary.getPrompt("OPS_DAILY_CLOSE_LEARNER");
  }

  /**
   * Get weekly report prompt for educator
   */
  getWeeklyReportEducator(streak: number, compAvg: number) {
    return this.promptLibrary.getPrompt("OPS_WEEKLY_REPORT_EDUCATOR", {
      STREAK: streak,
      COMP: compAvg,
    });
  }

  /**
   * Check if learner completed daily boot
   */
  async hasDailyBootCompleted(userId: string, date: Date): Promise<boolean> {
    // TODO: Check in OpsSnapshot or SessionEvent
    return false;
  }

  /**
   * Suggest next action based on context
   */
  suggestNextAction(
    hasDailyBoot: boolean,
    isCoReadingDay: boolean,
    queueItem?: { title: string; estMin: number },
  ) {
    if (!hasDailyBoot) {
      return this.getDailyBootLearner('BOOT');
    }

    if (isCoReadingDay) {
      return this.getDailyBootEducator([new Date().getDay()]);
    }

    if (queueItem) {
      return this.getQueueNext(queueItem.title, queueItem.estMin);
    }

    return null;
  }
}
