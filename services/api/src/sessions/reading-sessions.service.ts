import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileService } from '../profiles/profile.service';
import { GamificationService } from '../gamification/gamification.service';
import { VocabService } from '../vocab/vocab.service';
import { OutcomesService } from '../outcomes/outcomes.service';
import { GatingService } from '../gating/gating.service';
import { PrePhaseDto } from './dto/reading-sessions.dto';
import { StartSessionDto, FinishSessionDto } from './dto/start-session.dto';
import { PromptMessageDto } from './dto/prompt-message.dto';
import { AgentTurnResponseDto } from './dto/agent-turn-response.dto';
import { QuickCommandParser } from './parsers/quick-command.parser';
import { AiServiceClient } from '../ai-service/ai-service.client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuid } from 'uuid';

@Injectable()
export class ReadingSessionsService {
  private readonly logger = new Logger(ReadingSessionsService.name);

  constructor(
    private prisma: PrismaService,
    private profileService: ProfileService,
    private gamificationService: GamificationService,
    private vocabService: VocabService,
    private outcomesService: OutcomesService,
    private gatingService: GatingService,
    private quickCommandParser: QuickCommandParser,
    private aiServiceClient: AiServiceClient,
    @Inject(EventEmitter2) private eventEmitter: EventEmitter2,
  ) {}

  async startSession(userId: string, contentId: string) {
    // 1. Get/create learner profile
    const profile = await this.profileService.getOrCreate(userId);

    // 2. Verify content exists
    const content = await this.prisma.content.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    // 3. Determine appropriate layer based on user eligibility
    const assetLayer = await this.gatingService.determineLayer(userId, contentId);
    
    this.logger.log(`Starting session for user ${userId}, content ${contentId}, layer: ${assetLayer}`);
    
    // 4. Create session with phase=PRE
    const session = await this.prisma.readingSession.create({
      data: {
        userId,
        contentId,
        phase: 'PRE',
        modality: 'READING',
        assetLayer,
      },
      include: {
        content: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
      },
    });

    // 4. Return with minTargetWords
    return {
      ...session,
      minTargetWords: this.getMinTargetWords(profile.educationLevel as any),
    };
  }

  async getSession(sessionId: string, userId: string) {
    const session = await this.prisma.readingSession.findUnique({
      where: { id: sessionId },
      include: {
        content: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
        outcome: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return session;
  }

  async updatePrePhase(sessionId: string, userId: string, data: PrePhaseDto) {
    const session = await this.getSession(sessionId, userId);

    if (session.phase !== 'PRE') {
      throw new BadRequestException('Session not in PRE phase');
    }

    // Validate target words count
    const profile = await this.profileService.get(userId);
    const minWords = this.getMinTargetWords(profile.educationLevel as any);

    if (data.targetWordsJson.length < minWords) {
      throw new BadRequestException(
        `Minimum ${minWords} target words required for ${profile.educationLevel} level`
      );
    }

    // Update and advance to DURING
    return this.prisma.readingSession.update({
      where: { id: sessionId },
      data: {
        goalStatement: data.goalStatement,
        predictionText: data.predictionText,
        targetWordsJson: data.targetWordsJson,
        phase: 'DURING',
      },
    });
  }

  async recordEvent(sessionId: string, eventType: string, payload: any) {
    // Verify session exists
    const session = await this.prisma.readingSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return this.prisma.sessionEvent.create({
      data: {
        readingSessionId: sessionId,
        eventType: eventType as any,
        payloadJson: payload,
      },
    });
  }

  async advancePhase(sessionId: string, userId: string, toPhase: 'POST' | 'FINISHED') {
    const session = await this.getSession(sessionId, userId);

    // Validate transition
    if (toPhase === 'POST' && session.phase !== 'DURING') {
      throw new BadRequestException('Can only advance to POST from DURING phase');
    }

    if (toPhase === 'FINISHED') {
      if (session.phase !== 'POST') {
        throw new BadRequestException('Can only finish from POST phase');
      }

      // Validate DoD (Definition of Done)
      await this.validatePostCompletion(sessionId, session.userId, session.contentId);
    }

    // Update session
    const updated = await this.prisma.readingSession.update({
      where: { id: sessionId },
      data: {
        phase: toPhase,
        ...(toPhase === 'FINISHED' && { finishedAt: new Date() }),
      },
    });

    // If finishing, compute outcomes and integrate with gamification
    if (toPhase === 'FINISHED') {
      await this.integrateWithGamification(updated);
      
      // Auto-create vocabulary from target words on session finish
      if (updated.targetWordsJson && Array.isArray(updated.targetWordsJson) && updated.targetWordsJson.length > 0) {
        try {
          this.logger.log(`Auto-creating vocab from ${updated.targetWordsJson.length} target words for session ${sessionId}`);
          await this.vocabService.createFromTargetWords(sessionId);
        } catch (vocabError) {
          this.logger.error(`Failed to create vocabulary for session ${sessionId}:`, vocabError);
        }
      }
      
      // Auto-calculate session outcomes on finish
      try {
        await this.outcomesService.computeSessionOutcomes(sessionId);
        this.logger.log(`Computed outcomes for session ${sessionId}`);
      } catch (outcomesError) {
        this.logger.error(`Failed to compute outcomes for session ${sessionId}:`, outcomesError);
      }
    }

    return updated;
  }

  private async validatePostCompletion(sessionId: string, userId: string, contentId: string) {
    // 1. Check Cornell Notes has summary
    const notes = await this.prisma.cornellNotes.findFirst({
      where: {
        contentId,
        userId,
      },
    });

    if (!notes?.summaryText?.trim()) {
      throw new BadRequestException(
        'Cornell Notes summary is required to complete the session. Please add a summary in the Cornell Notes section.'
      );
    }

    // 2. Check at least 1 quiz/checkpoint response
    const hasQuiz = await this.prisma.sessionEvent.count({
      where: {
        readingSessionId: sessionId,
        eventType: { in: ['QUIZ_RESPONSE', 'CHECKPOINT_RESPONSE'] },
      },
    }) > 0;

    if (!hasQuiz) {
      throw new BadRequestException(
        'At least 1 quiz or checkpoint response is required to complete the session.'
      );
    }

    // 3. Check at least 1 production submission
    const hasProduction = await this.prisma.sessionEvent.count({
      where: {
        readingSessionId: sessionId,
        eventType: 'PRODUCTION_SUBMIT',
      },
    }) > 0;

    if (!hasProduction) {
      throw new BadRequestException(
        'Production text submission is required to complete the session.'
      );
    }

    this.logger.log(`Session ${sessionId} passed DoD validation`);
  }

  private async computeOutcome(sessionId: string) {
    this.logger.log(`Computing outcome for session ${sessionId}`);

    // Get all session events
    const events = await this.prisma.sessionEvent.findMany({
      where: { readingSessionId: sessionId },
    });

    // Calculate comprehension score (basic - just completion for V3)
    const quizEvents = events.filter(
      e => e.eventType === 'QUIZ_RESPONSE' || e.eventType === 'CHECKPOINT_RESPONSE'
    );
    const comprehensionScore = quizEvents.length > 0 ? 100 : 0;

    // Calculate production score (based on word count)
    const prodEvents = events.filter(e => e.eventType === 'PRODUCTION_SUBMIT');
    const totalWords = prodEvents.reduce((sum, e) => {
      const payload = e.payloadJson as any;
      return sum + (payload.word_count || 0);
    }, 0);
    const productionScore = Math.min(100, totalWords * 2); // 50 words = 100 score

    // Calculate frustration index (based on unknown words marked)
    const unknownWords = events.filter(e => e.eventType === 'MARK_UNKNOWN_WORD').length;
    const frustrationIndex = Math.min(100, unknownWords * 5); // 20 unknown words = 100 index

    return this.prisma.sessionOutcome.create({
      data: {
        readingSessionId: sessionId,
        comprehensionScore,
        productionScore,
        frustrationIndex,
      },
    });
  }

  private async integrateWithGamification(session: any) {
    if (!session.finishedAt) return;

    const durationMinutes = Math.floor(
      (new Date(session.finishedAt).getTime() - new Date(session.startedAt).getTime()) / (1000 * 60)
    );

    this.logger.log(`Registering ${durationMinutes} minutes for user ${session.userId}`);

    try {
      await this.gamificationService.registerActivity(session.userId, {
        minutesSpentDelta: durationMinutes,
        lessonsCompletedDelta: 1,
      });
    } catch (error) {
      this.logger.error('Failed to register gamification activity', error);
      // Don't fail the session completion if gamification fails
    }
  }

  private getMinTargetWords(level: string): number {
    const MIN_WORDS = {
      FUNDAMENTAL_1: 3,
      FUNDAMENTAL_2: 4,
      MEDIO: 6,
      SUPERIOR: 8,
      ADULTO_LEIGO: 5,
    };
    return MIN_WORDS[level] || 5;
  }

  // ============================================
  // NEW: Prompt-Only Methods (Phase 1)
  // ============================================

  /**
   * POST /sessions/start - Prompt-only version
   * Creates session and returns initial prompt
   */
  async startSessionPromptOnly(userId: string, dto: StartSessionDto) {
    this.logger.log(`Starting prompt-only session for user ${userId}, content ${dto.contentId}`);

    // Create session (reuse existing logic)
    const profile = await this.profileService.getOrCreate(userId);
    const content = await this.prisma.content.findUnique({
      where: { id: dto.contentId },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    const assetLayer = dto.assetLayer || await this.gatingService.determineLayer(userId, dto.contentId);

    const session = await this.prisma.readingSession.create({
      data: {
        userId,
        contentId: dto.contentId,
        phase: 'PRE',
        modality: 'READING',
        assetLayer,
      },
    });

    // Generate threadId for LangGraph
    const threadId = uuid();

    // Initial prompt (Phase 1 stub)
    const nextPrompt = "Meta do dia: em 1 linha, o que você quer entender neste texto?";

    return {
      readingSessionId: session.id,
      threadId,
      nextPrompt,
    };
  }

  /**
   * POST /sessions/:id/prompt
   * Processes user prompt, parses commands, calls AI, returns response
   */
  async processPrompt(
    sessionId: string,
    dto: PromptMessageDto,
    userId: string,
  ): Promise<AgentTurnResponseDto> {
    this.logger.log(`Processing prompt for session ${sessionId}`);

    // 1. Verify session ownership
    const session = await this.getSession(sessionId, userId);

    // 2. Parse quick commands
    const parsedEvents = this.quickCommandParser.parse(dto.text, dto.metadata);

    // 3. Persist parsed events
    if (parsedEvents.length > 0) {
      this.logger.log(`Persisting ${parsedEvents.length} quick command events`);
      await this.persistEvents(sessionId, parsedEvents);
    }

    // 4. Call AI Service
    const aiResponse = await this.aiServiceClient.sendPrompt(dto);

    // 5. Persist AI-suggested events (if any)
    if (aiResponse.eventsToWrite && aiResponse.eventsToWrite.length > 0) {
      this.logger.log(`Persisting ${aiResponse.eventsToWrite.length} AI-suggested events`);
      await this.persistEvents(sessionId, aiResponse.eventsToWrite);
    }

    return aiResponse;
  }

  /**
   * POST /sessions/:id/finish
   * Marks session as finished
   */
  async finishSessionPromptOnly(
    sessionId: string,
    userId: string,
    dto: FinishSessionDto,
  ) {
    this.logger.log(`Finishing session ${sessionId}, reason: ${dto.reason}`);

    const session = await this.getSession(sessionId, userId);

    const updated = await this.prisma.readingSession.update({
      where: { id: sessionId },
      data: {
        phase: 'FINISHED',
        finishedAt: new Date(),
      },
    });

    // Trigger outcome computation (async)
    this.outcomesService.computeSessionOutcomes(sessionId).catch(err => {
      this.logger.error(`Failed to compute outcomes for ${sessionId}`, err);
    });

    return { ok: true, session: updated };
  }

  /**
   * Persists multiple events in batch with validation
   */
  private async persistEvents(sessionId: string, events: any[]) {
    // Note: Validation happens in QuickCommandParser for now
    // Add DTO validation here in future if needed

    await this.prisma.sessionEvent.createMany({
      data: events.map(e => ({
        readingSessionId: sessionId,
        eventType: e.eventType,
        payloadJson: e.payloadJson,
        occurredAt: new Date(),
      })),
    });

    // Emit event to trigger vocab capture and other listeners
    this.eventEmitter.emit('session.events.created', {
      sessionId,
      eventTypes: events.map(e => e.eventType),
    });
  }
}
