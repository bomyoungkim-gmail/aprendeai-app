import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FamilyEventService } from '../../events/family-event.service';
import { CoReadingStateMachine } from '../../state-machine/co-reading-state-machine.service';
import { PromptLibraryService } from '../../prompts/prompt-library.service';
import { CoReadingPhase, CoReadingContext } from '../../state-machine/types';
import { StartCoSessionDto } from '../dto/co-session.dto';

@Injectable()
export class CoReadingService {
  constructor(
    private prisma: PrismaService,
    private familyEventService: FamilyEventService,
    private stateMachine: CoReadingStateMachine,
    private promptLibrary: PromptLibraryService,
  ) {}

  /**
   * Starts a new co-reading session
   * 
   * @param dto - Session creation data including family, learner, educator, and content IDs
   * @returns Object containing:
   *   - coSession: Created session record
   *   - context: Initial state machine context (phase: BOOT)
   *   - nextPrompts: Initial prompts for learner and educator
   * 
   * Logs CO_SESSION_STARTED event to FamilyEventService
   */
  async start(dto: StartCoSessionDto) {
    // Create session record
    const coSession = await this.prisma.coReadingSession.create({
      data: {
        familyId: dto.familyId,
        learnerUserId: dto.learnerUserId,
        educatorUserId: dto.educatorUserId,
        readingSessionId: dto.readingSessionId,
        threadIdLearner: `thread_learner_${Date.now()}`,
        threadIdEducator: `thread_educator_${Date.now()}`,
        timeboxMin: dto.timeboxMin ?? 20,
        type: 'CO_READING',
        status: 'ACTIVE',
      },
    });

    // Log CO_SESSION_STARTED event
    await this.familyEventService.logCoSessionStarted(
      dto.readingSessionId,
      dto.educatorUserId,
      {
        domain: 'FAMILY',
        type: 'CO_SESSION_STARTED',
        data: {
          householdId: dto.familyId,
          coSessionId: coSession.id,
          learnerUserId: dto.learnerUserId,
          educatorUserId: dto.educatorUserId,
          readingSessionId: dto.readingSessionId,
          contentId: dto.contentId,
          timeboxMin: coSession.timeboxMin,
        },
      },
    );

    // Initialize state machine context
    const context: CoReadingContext = {
      coSessionId: coSession.id,
      householdId: dto.familyId,
      learnerUserId: dto.learnerUserId,
      educatorUserId: dto.educatorUserId,
      readingSessionId: dto.readingSessionId,
      currentPhase: CoReadingPhase.BOOT,
      timeboxMin: coSession.timeboxMin,
      checkpointFailCount: 0,
      startedAt: new Date(),
      phaseStartedAt: new Date(),
    };

    // Get initial prompts
    const learnerPrompt = this.promptLibrary.getPrompt('OPS_DAILY_BOOT_LEARNER');
    const educatorPrompt = this.promptLibrary.getPrompt('OPS_DAILY_BOOT_EDUCATOR', {
      DAYS: 'hoje',
    });

    return {
      coSession,
      context,
      nextPrompts: {
        learner: learnerPrompt,
        educator: educatorPrompt,
      },
    };
  }

  /**
   * Transitions co-reading session to next phase
   * 
   * @param coSessionId - Session ID
   * @param targetPhase - Target phase (PRE, DURING, POST, CLOSE)
   * @param context - Current session context
   * @returns Success status, new phase, and next prompt
   * @throws {BadRequestException} If transition is invalid
   * 
   * Valid transitions: BOOT→PRE→DURING→POST→CLOSE
   * Updates session status to COMPLETED when transitioning to CLOSE
   */
  async transitionPhase(
    coSessionId: string,
    targetPhase: CoReadingPhase,
    context: CoReadingContext,
  ) {
    const result = await this.stateMachine.transition(context, targetPhase);

    if (result.success) {
      // Update session status in DB if needed
      if (targetPhase === CoReadingPhase.CLOSE) {
        await this.prisma.coReadingSession.update({
          where: { id: coSessionId },
          data: {
            status: 'COMPLETED',
            endedAt: new Date(),
          },
        });
      }

      // Get next prompt if provided
      const nextPrompt = result.nextPromptKey
        ? this.promptLibrary.getPrompt(result.nextPromptKey)
        : null;

      return {
        success: true,
        newPhase: result.newPhase,
        nextPrompt,
      };
    }

    throw new BadRequestException(result.message);
  }

  /**
   * Handle checkpoint failure
   */
  async handleCheckpointFail(context: CoReadingContext) {
    const result = await this.stateMachine.handleCheckpointFail(context);

    if (result.shouldIntervene) {
      // Return intervention menu prompt for educator
      const interventionPrompt = this.promptLibrary.getPrompt(
        'EDU_INTERVENTION_MENU',
      );
      return {
        shouldIntervene: true,
        failCount: result.count,
        educatorPrompt: interventionPrompt,
      };
    }

    return {
      shouldIntervene: false,
      failCount: result.count,
    };
  }

  /**
   * Get session by ID
   */
  async getById(coSessionId: string) {
    return this.prisma.coReadingSession.findUnique({
      where: { id: coSessionId },
      include: {
        family: true,
        learner: true,
        educator: true,
        readingSession: true,
      },
    });
  }

  /**
   * Finish session
   */
  async finish(coSessionId: string, context: CoReadingContext) {
    const result = await this.stateMachine.close(context);

    await this.prisma.coReadingSession.update({
      where: { id: coSessionId },
      data: {
        status: 'COMPLETED',
        endedAt: new Date(),
      },
    });

    return result;
  }
}
