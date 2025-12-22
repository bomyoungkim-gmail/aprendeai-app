import { Injectable } from '@nestjs/common';
import { PromptLibraryService } from '../../prompts/prompt-library.service';

@Injectable()
export class OpsCoachService {
  constructor(private promptLibrary: PromptLibraryService) {}

  /**
   * Get daily boot prompt for learner
   */
  getDailyBootLearner() {
    return this.promptLibrary.getPrompt('OPS_DAILY_BOOT_LEARNER');
  }

  /**
   * Get daily boot prompt for educator (co-reading reminder)
   */
  getDailyBootEducator(coReadingDays: number[]) {
    const today = new Date().getDay(); // 0-6 (Sun-Sat)
    const isCoReadingDay = coReadingDays.includes(today);

    if (isCoReadingDay) {
      return this.promptLibrary.getPrompt('OPS_DAILY_BOOT_EDUCATOR', {
        DAYS: 'hoje',
      });
    }

    return null; // No reminder if not a co-reading day
  }

  /**
   * Get queue next item prompt
   */
  getQueueNext(title: string, estMin: number) {
    return this.promptLibrary.getPrompt('OPS_QUEUE_NEXT', {
      TITLE: title,
      MIN: estMin,
    });
  }

  /**
   * Get time log prompt
   */
  getTimeLogPrompt() {
    return this.promptLibrary.getPrompt('OPS_TIME_LOG');
  }

  /**
   * Get daily close prompt for learner
   */
  getDailyCloseLearner() {
    return this.promptLibrary.getPrompt('OPS_DAILY_CLOSE_LEARNER');
  }

  /**
   * Get weekly report prompt for educator
   */
  getWeeklyReportEducator(streak: number, compAvg: number) {
    return this.promptLibrary.getPrompt('OPS_WEEKLY_REPORT_EDUCATOR', {
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
      return this.getDailyBootLearner();
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
