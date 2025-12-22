import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PromptLibraryService } from '../../prompts/prompt-library.service';
import { FamilyEventService } from '../../events/family-event.service';
import { StartTeachBackDto } from '../dto/co-session.dto';

@Injectable()
export class TeachBackService {
  constructor(
    private prisma: PrismaService,
    private promptLibrary: PromptLibraryService,
    private familyEventService: FamilyEventService,
  ) {}

  /**
   * Offer teach-back mission to child after successful session
   */
  offerMission(childUserId: string) {
    return this.promptLibrary.getPrompt('TB_OFFER_MISSION');
  }

  /**
   * Start a teach-back session (role reversal)
   */
  async start(dto: StartTeachBackDto) {
    // Create teach-back co-session (child = educator, parent = learner)
    const session = await this.prisma.coReadingSession.create({
      data: {
        familyId: dto.familyId,
        learnerUserId: dto.parentUserId, // Parent as LEARNER
        educatorUserId: dto.childUserId, // Child as EDUCATOR
        readingSessionId: dto.baseReadingSessionId,
        threadIdLearner: `thread_tb_parent_${Date.now()}`,
        threadIdEducator: `thread_tb_child_${Date.now()}`,
        timeboxMin: dto.durationMin ?? 7,
        type: 'TEACH_BACK', // New type for teach-back
        status: 'ACTIVE',
      },
    });

    // Log event (reusing CO_SESSION_STARTED with TEACH_BACK context)
    await this.familyEventService.logCoSessionStarted(
      dto.baseReadingSessionId,
      dto.childUserId,
      {
        domain: 'FAMILY',
        type: 'CO_SESSION_STARTED',
        data: {
          householdId: dto.familyId,
          coSessionId: session.id,
          learnerUserId: dto.parentUserId,
          educatorUserId: dto.childUserId,
          readingSessionId: dto.baseReadingSessionId,
          contentId: 'TEACH_BACK_CONTENT',
          timeboxMin: session.timeboxMin,
        },
      },
    );

    // Get initial prompts for teach-back
    const childPrompt = this.promptLibrary.getPrompt('TB_STEP1_EXPLAIN', {
      W1: 'palavra1', // TODO: Get from session
      W2: 'palavra2',
    });

    const parentPrompt = this.promptLibrary.getPrompt('TB_PARENT_SUMMARY');

    return {
      session,
      nextPrompts: {
        child: childPrompt,
        parent: parentPrompt,
      },
    };
  }

  /**
   * Get step 2 prompt (example)
   */
  getStep2Prompt() {
    return this.promptLibrary.getPrompt('TB_STEP2_EXAMPLE', {
      W3: 'palavra3',
    });
  }

  /**
   * Get step 3 prompt (questions)
   */
  getStep3Prompt() {
    return this.promptLibrary.getPrompt('TB_STEP3_QUESTIONS');
  }

  /**
   * Calculate stars based on session quality
   */
  calculateStars(usedTargetWords: boolean, askedOpenQuestions: boolean): number {
    let stars = 0;

    if (usedTargetWords) stars += 1;
    if (askedOpenQuestions) stars += 1;

    // Bonus star if parent understood
    stars += 1;

    return Math.min(stars, 3);
  }

  /**
   * Finish teach-back session with reward
   */
  async finish(sessionId: string, stars: number) {
    await this.prisma.coReadingSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        endedAt: new Date(),
      },
    });

    // TODO: Log TEACH_BACK_FINISHED event with stars

    return this.promptLibrary.getPrompt('TB_REWARD', { STARS: stars });
  }
}
