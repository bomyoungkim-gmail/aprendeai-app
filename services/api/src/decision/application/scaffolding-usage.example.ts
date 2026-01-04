/**
 * Example: How to use ScaffoldingService.updateMastery
 * 
 * This shows how other services (e.g., AssessmentService, GamesService) 
 * should call updateMastery to persist learner progress.
 */

import { Injectable } from '@nestjs/common';
import { ScaffoldingService } from './scaffolding.service';

@Injectable()
export class ExampleUsageService {
  constructor(private readonly scaffoldingService: ScaffoldingService) {}

  /**
   * Example 1: After a quiz is completed
   */
  async onQuizCompleted(userId: string, domain: string, isCorrect: boolean) {
    await this.scaffoldingService.updateMastery(userId, {
      type: isCorrect ? 'quiz_correct' : 'quiz_incorrect',
      domain,
      timestamp: new Date(),
    });
  }

  /**
   * Example 2: After a checkpoint is passed/failed
   */
  async onCheckpointCompleted(userId: string, domain: string, passed: boolean) {
    await this.scaffoldingService.updateMastery(userId, {
      type: passed ? 'checkpoint_passed' : 'checkpoint_failed',
      domain,
      timestamp: new Date(),
    });
  }

  /**
   * Example 3: After a mission is completed
   */
  async onMissionCompleted(userId: string, domain: string) {
    await this.scaffoldingService.updateMastery(userId, {
      type: 'mission_completed',
      domain,
      timestamp: new Date(),
    });
  }

  /**
   * Example 4: When user asks for help (indicates struggle)
   */
  async onHelpRequested(userId: string, domain: string) {
    await this.scaffoldingService.updateMastery(userId, {
      type: 'asked_for_help',
      domain,
      timestamp: new Date(),
    });
  }
}
