import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
  Inject,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ProfileService } from "../profiles/profile.service";
import { GamificationService } from "../gamification/gamification.service";
import { VocabService } from "../vocab/vocab.service";
import { OutcomesService } from "../outcomes/outcomes.service";
import { GatingService } from "../gating/gating.service";
import { SrsService } from "../srs/srs.service";
import { extractVocabFromEvents } from "./helpers/vocab-extractor";
import { PrePhaseDto } from "./dto/reading-sessions.dto";
import { StartSessionDto, FinishSessionDto } from "./dto/start-session.dto";
import { PromptMessageDto } from "./dto/prompt-message.dto";
import { AgentTurnResponseDto } from "./dto/agent-turn-response.dto";
import { QuickCommandParser } from "./parsers/quick-command.parser";
import { AiServiceClient } from "../ai-service/ai-service.client";
import { ActivityService } from "../activity/activity.service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { v4 as uuid } from "uuid";
import { SessionsQueryDto } from "./dto/sessions-query.dto";
import { Prisma } from "@prisma/client";
import { ProviderUsageService } from "../observability/provider-usage.service";
import { StartSessionUseCase } from "./application/use-cases/start-session.use-case";
import { GetSessionUseCase } from "./application/use-cases/get-session.use-case";
import { UpdatePrePhaseUseCase } from "./application/use-cases/update-pre-phase.use-case";
import { AdvancePhaseUseCase } from "./application/use-cases/advance-phase.use-case";
import { RecordEventUseCase } from "./application/use-cases/record-event.use-case";
import { UpdateReadingProgressUseCase } from "./application/use-cases/update-reading-progress.use-case";
import { GetReadingProgressUseCase } from "./application/use-cases/get-reading-progress.use-case";
import { CreateBookmarkUseCase } from "./application/use-cases/create-bookmark.use-case";
import { GetBookmarksUseCase } from "./application/use-cases/get-bookmarks.use-case";
import { DeleteBookmarkUseCase } from "./application/use-cases/delete-bookmark.use-case";
import { UpdateReadingProgressDto } from "./dto/reading-progress.dto";
import { CreateBookmarkDto } from "./dto/bookmarks.dto";
import { normalizeEventsToWrite } from "../utils/normalize-events-to-write";
import { FlowStateDetectorService } from "../decision/application/flow-state-detector.service";

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
    private srsService: SrsService,
    private quickCommandParser: QuickCommandParser,
    private aiServiceClient: AiServiceClient,
    private providerUsageService: ProviderUsageService,
    private activityService: ActivityService,
    @Inject(EventEmitter2) private eventEmitter: EventEmitter2,
    // Refactored Use Cases
    private startSessionUseCase: StartSessionUseCase,
    private getSessionUseCase: GetSessionUseCase,
    private updatePrePhaseUseCase: UpdatePrePhaseUseCase,
    private advancePhaseUseCase: AdvancePhaseUseCase,
    private recordEventUseCase: RecordEventUseCase,
    private updateReadingProgressUseCase: UpdateReadingProgressUseCase,
    private getReadingProgressUseCase: GetReadingProgressUseCase,
    private createBookmarkUseCase: CreateBookmarkUseCase,
    private getBookmarksUseCase: GetBookmarksUseCase,
    private deleteBookmarkUseCase: DeleteBookmarkUseCase,
    private flowStateDetector: FlowStateDetectorService, // Injected
  ) {}

  async startSession(user_id: string, content_id: string) {
    return this.startSessionUseCase.execute(user_id, content_id);
  }

  async getSession(sessionId: string, user_id: string) {
    return this.getSessionUseCase.execute(sessionId, user_id);
  }

  async updatePrePhase(sessionId: string, user_id: string, data: PrePhaseDto) {
    return this.updatePrePhaseUseCase.execute(sessionId, user_id, data);
  }

  async recordEvent(sessionId: string, event_type: string, payload: any) {
    return this.recordEventUseCase.execute(sessionId, event_type, payload);
  }

  async advancePhase(
    sessionId: string,
    user_id: string,
    toPhase: "POST" | "FINISHED",
  ) {
    const updated = await this.advancePhaseUseCase.execute(
      sessionId,
      user_id,
      toPhase,
    );

    // If finishing, compute outcomes and integrate with gamification
    // Note: Use Case only handles state transition. Side effects like Gamification/Outcomes
    // ideally happen via Domain Events, but for now we keep them here or move them later.
    // The previous implementation did this integration AFTER update.
    if (toPhase === "FINISHED") {
      await this.integrateWithGamification(updated); // Pass compatible object or map

      // Auto-create vocabulary from target words on session finish
      if (
        updated.targetWordsJson &&
        Array.isArray(updated.targetWordsJson) &&
        (updated.targetWordsJson as any[]).length > 0
      ) {
        try {
          this.logger.log(
            `Auto-creating vocab from ${(updated.targetWordsJson as any[]).length} target words for session ${sessionId}`,
          );
          await this.vocabService.createFromTargetWords(sessionId);
        } catch (vocabError) {
          this.logger.error(
            `Failed to create vocabulary for session ${sessionId}:`,
            vocabError,
          );
        }
      }

      // Auto-calculate session outcomes on finish
      try {
        await this.outcomesService.computeSessionOutcomes(sessionId);
        this.logger.log(`Computed outcomes for session ${sessionId}`);
      } catch (outcomesError) {
        this.logger.error(
          `Failed to compute outcomes for session ${sessionId}:`,
          outcomesError,
        );
      }

      // Schedule SRS reviews for marked vocabulary
      try {
        const events = await this.prisma.session_events.findMany({
          where: { reading_session_id: sessionId },
        });

        const vocabList = extractVocabFromEvents(events);

        if (vocabList.length > 0) {
          this.logger.log(
            `Scheduling SRS reviews for ${vocabList.length} vocab items from session ${sessionId}`,
          );

          for (const vocab of vocabList) {
            await this.srsService.scheduleNextReview(
              user_id,
              updated.contentId,
              vocab.word,
              vocab.context,
            );
          }

          this.logger.log(
            `Successfully scheduled ${vocabList.length} vocab items for SRS review`,
          );
        }
      } catch (srsError) {
        this.logger.error(
          `Failed to schedule SRS reviews for session ${sessionId}:`,
          srsError,
        );
        // Don't fail session finish if SRS scheduling fails
      }
    }

    return updated;
  }

  private async validatePostCompletion(
    sessionId: string,
    user_id: string,
    content_id: string,
  ) {
    // 1. Check Cornell Notes has summary
    const notes = await this.prisma.cornell_notes.findFirst({
      where: {
        content_id,
        user_id,
      },
    });

    if (!notes?.summary_text?.trim()) {
      throw new BadRequestException(
        "Cornell Notes summary is required to complete the session. Please add a summary in the Cornell Notes section.",
      );
    }

    // 2. Check at least 1 quiz/checkpoint response
    const hasQuiz =
      (await this.prisma.session_events.count({
        where: {
          reading_session_id: sessionId,
          event_type: { in: ["QUIZ_RESPONSE", "CHECKPOINT_RESPONSE"] },
        },
      })) > 0;

    if (!hasQuiz) {
      throw new BadRequestException(
        "At least 1 quiz or checkpoint response is required to complete the session.",
      );
    }

    // 3. Check at least 1 production submission
    const hasProduction =
      (await this.prisma.session_events.count({
        where: {
          reading_session_id: sessionId,
          event_type: "PRODUCTION_SUBMIT",
        },
      })) > 0;

    if (!hasProduction) {
      throw new BadRequestException(
        "Production text submission is required to complete the session.",
      );
    }

    this.logger.log(`Session ${sessionId} passed DoD validation`);
  }

  private async computeOutcome(sessionId: string) {
    this.logger.log(`Computing outcome for session ${sessionId}`);

    // Get all session events
    const events = await this.prisma.session_events.findMany({
      where: { reading_session_id: sessionId },
    });

    // Calculate comprehension score (basic - just completion for V3)
    const quizEvents = events.filter(
      (e) =>
        e.event_type === "QUIZ_RESPONSE" ||
        e.event_type === "CHECKPOINT_RESPONSE",
    );
    const comprehensionScore = quizEvents.length > 0 ? 100 : 0;

    // Calculate production score (based on word count)
    const prodEvents = events.filter(
      (e) => e.event_type === "PRODUCTION_SUBMIT",
    );
    const totalWords = prodEvents.reduce((sum, e) => {
      const payload = e.payload_json as any;
      return sum + (payload.word_count || 0);
    }, 0);
    const productionScore = Math.min(100, totalWords * 2); // 50 words = 100 score

    // Calculate frustration index (based on unknown words marked)
    const unknownWords = events.filter(
      (e) => e.event_type === "MARK_UNKNOWN_WORD",
    ).length;
    const frustrationIndex = Math.min(100, unknownWords * 5); // 20 unknown words = 100 index

    return this.prisma.session_outcomes.create({
      data: {
        reading_session_id: sessionId,
        comprehension_score: comprehensionScore,
        production_score: productionScore,
        frustration_index: frustrationIndex,
      },
    });
  }

  private async integrateWithGamification(session: any) {
    if (!session.finishedAt && !session.finished_at) return;
    const finishedAt = session.finishedAt || session.finished_at;
    const startedAt = session.startTime || session.started_at;

    const durationMinutes = Math.floor(
      (new Date(finishedAt).getTime() - new Date(startedAt).getTime()) /
        (1000 * 60),
    );

    this.logger.log(
      `Registering ${durationMinutes} minutes for user ${session.user_id}`,
    );

    try {
      await this.gamificationService.registerActivity(session.user_id, {
        minutesSpentDelta: durationMinutes,
        lessonsCompletedDelta: 1,
      });
    } catch (error) {
      this.logger.error("Failed to register gamification activity", error);
      // Don't fail the session completion if gamification fails
    }

    // Track activity for dashboard metrics
    try {
      // Track study time
      await this.activityService.trackActivity(
        session.user_id,
        "study",
        durationMinutes,
      );
      // Track session completion
      await this.activityService.trackActivity(session.user_id, "session");
    } catch (error) {
      this.logger.warn("Failed to track activity metrics", error);
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
  async startSessionPromptOnly(user_id: string, dto: StartSessionDto) {
    this.logger.log(
      `Starting prompt-only session for user ${user_id}, content ${dto.contentId}`,
    );

    // Create session (reuse existing logic)
    const profile = await this.profileService.getOrCreate(user_id);
    const content = await this.prisma.contents.findUnique({
      where: { id: dto.contentId },
    });

    if (!content) {
      throw new NotFoundException("Content not found");
    }

    const assetLayer =
      dto.assetLayer ||
      (await this.gatingService.determineLayer(user_id, dto.contentId));

    const session = await this.prisma.reading_sessions.create({
      data: {
        id: uuid(),
        user_id: user_id,
        content_id: dto.contentId,
        phase: "PRE",
        modality: "READING",
        asset_layer: assetLayer,
      },
    });

    // Script 02: Persist UI mode override if requested
    if (dto.uiMode && dto.persistUiMode) {
      await this.prisma.contents.update({
        where: { id: dto.contentId },
        data: {
          mode: dto.uiMode as any, // Cast to ContentMode enum
          mode_source: 'USER',
          mode_set_by: user_id,
          mode_set_at: new Date(),
        },
      });
      this.logger.log(
        `Persisted UI mode override: ${dto.uiMode} for content ${dto.contentId}`,
      );
    }

    // Generate threadId for LangGraph
    const threadId = uuid();

    // Initial prompt (Phase 1 stub)
    const nextPrompt =
      "Meta do dia: em 1 linha, o que você quer entender neste texto?";

    return {
      reading_session_id: session.id,
      threadId,
      nextPrompt,
    };
  }

  /**
   * Enrich prompt context with compact state, recent history, and content slice
   * Phase 3: Token optimization (40K → 6K tokens)
   * Phase 4: Context Resurrection (cross-session awareness)
   */
  private async enrichPromptContext(
    sessionId: string,
    user_id: string,
    content_id: string,
    userText: string,
  ): Promise<any> {
    // 1. Load compact pedagogical state from Redis (Phase 3)
    let pedState = null;
    try {
      const { loadCompactState } =
        await import("../common/helpers/redis-context.helper");
      pedState = await loadCompactState(user_id, content_id);

      if (pedState) {
        this.logger.debug(`Loaded compact state for ${user_id}/${content_id}`);
      }
    } catch (err) {
      this.logger.warn(`Failed to load compact state: ${err.message}`);
    }

    // 2. Get last 6 turns (window for efficient context)
    const lastTurns = await this.prisma.session_events.findMany({
      where: {
        reading_session_id: sessionId,
        event_type: { in: ["PROMPT_SENT", "PROMPT_RECEIVED"] },
      },
      orderBy: { created_at: "desc" },
      take: 6,
      select: {
        payload_json: true,
        created_at: true,
      },
    });

    // Format turns for AI context
    const formattedTurns = lastTurns.reverse().map((event: any) => ({
      role: event.payloadJson?.role || "user",
      text: event.payloadJson?.text || event.payloadJson?.content || "",
      timestamp: event.createdAt,
    }));

    // 3. Get current content slice (NOT entire book!)
    // For now, use first 12K chars. TODO: implement block-based slicing
    let contentSlice = "";
    try {
      const content = await this.prisma.contents.findUnique({
        where: { id: content_id },
        select: { raw_text: true },
      });

      if (content?.raw_text) {
        // Take first 12K chars (≈3K tokens)
        contentSlice = content.raw_text.substring(0, 12000);
        this.logger.debug(`Content slice: ${contentSlice.length} chars`);
      }
    } catch (err) {
      this.logger.warn(`Failed to load content slice: ${err.message}`);
    }

    // 4. Fetch session annotations for quiz generation
    let sessionAnnotations = { mainIdeas: [], doubts: [] };
    try {
      const annotations = await this.prisma.annotations.findMany({
        where: {
          user_id,
          content_id,
          type: { in: ['MAIN_IDEA', 'DOUBT'] },
        },
        select: {
          type: true,
          text: true,
          selected_text: true,
        },
        orderBy: { created_at: 'desc' },
        take: 10, // Limit to recent annotations
      });

      sessionAnnotations = {
        mainIdeas: annotations
          .filter((a) => a.type === 'MAIN_IDEA')
          .map((a) => ({ text: a.text || a.selected_text || '' })),
        doubts: annotations
          .filter((a) => a.type === 'DOUBT')
          .map((a) => ({ text: a.text || a.selected_text || '' })),
      };

      this.logger.debug(
        `Loaded ${sessionAnnotations.mainIdeas.length} MAIN_IDEA and ${sessionAnnotations.doubts.length} DOUBT annotations`,
      );
    } catch (err) {
      this.logger.warn(`Failed to load annotations: ${err.message}`);
    }

    // 5. Context Resurrection: Fetch previous session data
    let resurrection = null;
    try {
      // 4a. Last session for SAME content (for "return to material A" scenario)
      const lastSameContentSession = await this.prisma.reading_sessions.findFirst({
        where: {
          user_id,
          content_id,
          id: { not: sessionId }, // Exclude current session
          phase: { in: ["FINISHED", "POST"] }, // Only completed or advanced sessions
        },
        orderBy: { finished_at: "desc" },
        select: {
          id: true,
          finished_at: true,
          phase: true,
          session_outcomes: {
            select: {
              comprehension_score: true,
              production_score: true,
            },
          },
        },
      });

      // 4b. Fetch cornell_notes and reading_progress separately (they're keyed by user_id + content_id)
      const [cornellNotes, readingProgress] = await Promise.all([
        this.prisma.cornell_notes.findUnique({
          where: {
            content_id_user_id: {
              content_id,
              user_id,
            },
          },
          select: {
            summary_text: true,
          },
        }),
        this.prisma.reading_progress.findUnique({
          where: {
            user_id_content_id: {
              user_id,
              content_id,
            },
          },
          select: {
            last_page: true,
            last_scroll_pct: true,
          },
        }),
      ]);

      // 4c. Last global activity (ANY content, for "what did I do last?" scenario)
      const lastGlobalActivity = await this.prisma.reading_sessions.findFirst({
        where: {
          user_id,
          id: { not: sessionId },
          finished_at: { not: null },
        },
        orderBy: { finished_at: "desc" },
        select: {
          id: true,
          finished_at: true,
          contents: {
            select: {
              title: true,
              type: true,
            },
          },
        },
      });

      // Build resurrection context
      if (lastSameContentSession || lastGlobalActivity) {
        resurrection = {
          last_session_summary: null as string | null,
          last_global_activity: null as string | null,
        };

        // Format same-content summary
        if (lastSameContentSession) {
          const parts: string[] = [];
          
          if (readingProgress?.last_page) {
            parts.push(`Página ${readingProgress.last_page}`);
          } else if (readingProgress?.last_scroll_pct) {
            parts.push(`${Math.round(readingProgress.last_scroll_pct)}% do texto`);
          }

          if (cornellNotes?.summary_text) {
            const summary = cornellNotes.summary_text.substring(0, 200);
            parts.push(`Resumo: "${summary}${summary.length >= 200 ? '...' : ''}"`);
          }

          if (lastSameContentSession.session_outcomes) {
            const outcome = lastSameContentSession.session_outcomes;
            parts.push(`Compreensão: ${outcome.comprehension_score}%`);
          }

          if (parts.length > 0) {
            resurrection.last_session_summary = parts.join(". ");
          }
        }

        // Format global activity
        if (lastGlobalActivity && lastGlobalActivity.id !== lastSameContentSession?.id) {
          const timeSince = lastGlobalActivity.finished_at
            ? Math.floor(
                (Date.now() - new Date(lastGlobalActivity.finished_at).getTime()) /
                  (1000 * 60 * 60),
              )
            : null;

          resurrection.last_global_activity = 
            `Estudou "${lastGlobalActivity.contents.title}" ${
              timeSince ? `há ${timeSince}h` : "recentemente"
            }`;
        }

        this.logger.debug(
          `Context resurrection loaded: same=${!!resurrection.last_session_summary}, global=${!!resurrection.last_global_activity}`,
        );

        // Emit telemetry event for resurrection usage tracking
        this.eventEmitter.emit("context.resurrection.used", {
          sessionId,
          userId: user_id,
          contentId: content_id,
          hasSameContentSummary: !!resurrection.last_session_summary,
          hasGlobalActivity: !!resurrection.last_global_activity,
        });
      }
    } catch (err) {
      this.logger.warn(`Failed to load resurrection context: ${err.message}`);
    }

    // 6. Flow State Detection (SCRIPT 03 - Gap 8)
    let flowState = { isInFlow: false, confidence: 0 };
    try {
       flowState = await this.flowStateDetector.detectFlowState(
         user_id,
         content_id,
         sessionId
       );
       this.logger.debug(`Flow State: isInFlow=${flowState.isInFlow} (${flowState.confidence.toFixed(2)})`);
    } catch (err) {
       this.logger.warn(`Failed to detect flow state: ${err.message}`);
    }

    return {
      pedState: pedState || {},
      lastTurns: formattedTurns,
      contentSlice,
      memoriesTopK: 6, // For AI service retrieval
      resurrection, // Cross-session context
      sessionAnnotations, // User annotations for quiz generation
      flowState, // NEW: Flow State
      contextPlan: {
        prefixVersion: "CANONICAL_PREFIX_V1",
        lastTurnsWindow: 6,
        memoriesTopK: 6,
        contentSliceChars: contentSlice.length,
      },
    };
  }

  /**
   * POST /sessions/:id/prompt
   * Processes user prompt, parses commands, calls AI, returns response
   */
  async processPrompt(
    sessionId: string,
    dto: PromptMessageDto,
    user_id: string,
  ): Promise<AgentTurnResponseDto> {
    this.logger.log(`Processing prompt for session ${sessionId}`);

    // 1. Verify session ownership
    const session = await this.getSession(sessionId, user_id);

    // 2. Parse quick commands
    const parsedEvents = this.quickCommandParser.parse(dto.text, dto.metadata);

    // 3. Persist parsed events
    if (parsedEvents.length > 0) {
      this.logger.log(`Persisting ${parsedEvents.length} quick command events`);
      await this.persistEvents(sessionId, parsedEvents);
    }

    // 4. Phase 3: Enrich context for AI (token optimization)
    const enrichedContext = await this.enrichPromptContext(
      sessionId,
      user_id,
      session.session.content_id,
      dto.text,
    );

    // Inject enriched metadata
    const enrichedDto = {
      ...dto,
      metadata: {
        ...dto.metadata,
        tenantId: user_id, // For memory namespacing
        user_id,
        content_id: session.session.content_id,
        ...enrichedContext, // pedState, lastTurns, contentSlice
      },
    };

    // Call AI Service with enriched context
    const aiResponse = await this.aiServiceClient.sendPrompt(enrichedDto);

    // Track Usage (Granular)
    if (aiResponse.usage) {
      // Fetch user context for attribution
      const [user, familyMember] = await Promise.all([
        this.prisma.users.findUnique({
          where: { id: user_id },
          // Cast select to avoid lint errors if client is stale vs schema
          select: { last_institution_id: true } as any,
        }),
        this.prisma.family_members.findFirst({
          where: { user_id },
          select: { family_id: true },
        }),
      ]);

      // Fire & Forget Tracking
      this.providerUsageService.trackUsage({
        provider: "educator_agent", // Abstraction
        operation: "turn",
        tokens: aiResponse.usage.total_tokens,
        promptTokens: aiResponse.usage.prompt_tokens,
        completionTokens: aiResponse.usage.completion_tokens,
        costUsd: aiResponse.usage.cost_est_usd,
        userId: user_id,
        familyId: familyMember?.family_id,
        institutionId: (user as any)?.last_institution_id,
        feature: "educator_chat",
        metadata: {
          sessionId,
          reading_session_id: sessionId,
          model: "multi-agent-mix", // Python side handles specific model logging details internally if needed in `details`
        },
      });
    }

    // 5. Persist AI-suggested events (if any)
    if (aiResponse.eventsToWrite && aiResponse.eventsToWrite.length > 0) {
      this.logger.log(
        `Persisting ${aiResponse.eventsToWrite.length} AI-suggested events`,
      );
      await this.persistEvents(sessionId, aiResponse.eventsToWrite);

      // Phase 3: Enqueue memory compaction if session finished
      const hasFinishEvent = aiResponse.eventsToWrite.some(
        (e: any) =>
          e.eventType === "CO_SESSION_FINISHED" ||
          e.eventType === "READING_SESSION_FINISHED",
      );

      if (hasFinishEvent) {
        this.logger.log("Session finished detected, enqueueing memory job");
        try {
          const { enqueueMemoryJob } =
            await import("../common/helpers/redis-context.helper");

          // Build lightweight outcome from session for memory extraction
          const outcome = {
            top_blockers: [], // TODO: extract from MARK_UNKNOWN_WORD events
            best_intervention: null, // TODO: track from session
            vocab_learned: [], // TODO: extract from events
            phase: session.session.phase,
          };

          await enqueueMemoryJob({
            tenantId: user_id,
            userId: user_id,
            contentId: session.session.content_id,
            sessionOutcome: outcome,
          });
        } catch (err) {
          this.logger.warn(`Failed to enqueue memory job: ${err.message}`);
        }
      }
    }

    return aiResponse;
  }

  /**
   * POST /sessions/:id/finish
   * Marks session as finished
   */
  async finishSessionPromptOnly(
    sessionId: string,
    user_id: string,
    dto: FinishSessionDto,
  ) {
    this.logger.log(`Finishing session ${sessionId}, reason: ${dto.reason}`);

    const session = await this.getSession(sessionId, user_id);

    const updated = await this.prisma.reading_sessions.update({
      where: { id: sessionId },
      data: {
        phase: "FINISHED",
        finished_at: new Date(),
      },
    });

    // Trigger outcome computation (async)
    this.outcomesService.computeSessionOutcomes(sessionId).catch((err) => {
      this.logger.error(`Failed to compute outcomes for ${sessionId}`, err);
    });

    // Track activity in daily_activities table
    try {
      const sessionDuration = session.session.finished_at
        ? Math.floor(
            (new Date(session.session.finished_at).getTime() -
              new Date(session.session.created_at).getTime()) /
              (1000 * 60),
          )
        : 0;

      // Count annotations created during this session
      const annotationsCount = await this.prisma.session_events.count({
        where: {
          reading_session_id: sessionId,
          event_type: 'MARK_UNKNOWN_WORD',
        },
      });

      const todayDate = new Date(new Date().toISOString().split('T')[0]);
      
      const existingActivity = await this.prisma.daily_activities.findFirst({
        where: {
          user_id: user_id,
          date: todayDate,
        },
      });

      if (existingActivity) {
        await this.prisma.daily_activities.update({
          where: { id: existingActivity.id },
          data: {
            minutes_studied: { increment: sessionDuration },
            sessions_count: { increment: 1 },
            contents_read: { increment: 1 },
            annotations_created: { increment: annotationsCount },
          },
        });
      } else {
        await this.prisma.daily_activities.create({
          data: {
            id: uuid(),
            user_id: user_id,
            date: todayDate,
            minutes_studied: sessionDuration,
            sessions_count: 1,
            contents_read: 1,
            annotations_created: annotationsCount,
          },
        });
      }

      this.logger.log(
        `Tracked activity: ${sessionDuration}min, ${annotationsCount} annotations`,
      );

      // Award badges based on milestones
      await this.awardBadgesIfEligible(user_id, {
        sessionDuration,
        annotationsCount,
      });
    } catch (err) {
      this.logger.warn(`Failed to track daily activity: ${err.message}`);
    }

    return { ok: true, session: updated };
  }

  /**
   * Award badges to user if they've reached milestones
   */
  private async awardBadgesIfEligible(
    userId: string,
    metrics: { sessionDuration: number; annotationsCount: number },
  ) {
    try {
      // Get user's total stats
      const [totalSessions, totalMinutes, totalAnnotations, currentStreak] =
        await Promise.all([
          this.prisma.reading_sessions.count({
            where: { user_id: userId, phase: 'FINISHED' },
          }),
          this.prisma.daily_activities.aggregate({
            where: { user_id: userId },
            _sum: { minutes_studied: true },
          }),
          this.prisma.session_events.count({
            where: {
              reading_sessions: { user_id: userId },
              event_type: 'MARK_UNKNOWN_WORD',
            },
          }),
          this.prisma.streaks
            .findUnique({ where: { user_id: userId } })
            .then((s) => s?.current_streak || 0),
        ]);

      const totalHours = Math.floor(
        (totalMinutes._sum.minutes_studied || 0) / 60,
      );

      // Define badge eligibility
      const badgesToAward: string[] = [];

      // First session
      if (totalSessions === 1) badgesToAward.push('badge-first-session');

      // Session milestones
      if (totalSessions === 10) badgesToAward.push('badge-sessions-10');
      if (totalSessions === 50) badgesToAward.push('badge-sessions-50');
      if (totalSessions === 100) badgesToAward.push('badge-sessions-100');

      // Time milestones
      if (totalHours === 10) badgesToAward.push('badge-hours-10');
      if (totalHours === 50) badgesToAward.push('badge-hours-50');
      if (totalHours === 100) badgesToAward.push('badge-hours-100');

      // Annotation milestones
      if (totalAnnotations === 25) badgesToAward.push('badge-notes-25');
      if (totalAnnotations === 100) badgesToAward.push('badge-notes-100');
      if (totalAnnotations === 500) badgesToAward.push('badge-notes-500');

      // Streak milestones
      if (currentStreak === 3) badgesToAward.push('badge-streak-3');
      if (currentStreak === 7) badgesToAward.push('badge-streak-7');
      if (currentStreak === 30) badgesToAward.push('badge-streak-30');

      // Award badges (skip if already awarded)
      for (const badgeId of badgesToAward) {
        await this.prisma.user_badges
          .create({
            data: {
              id: uuid(),
              users: { connect: { id: userId } },
              badges: { connect: { id: badgeId } },
              awarded_at: new Date(),
            },
          })
          .catch(() => {
            // Ignore duplicate errors (badge already awarded)
          });
      }

      if (badgesToAward.length > 0) {
        this.logger.log(`Awarded ${badgesToAward.length} badges to ${userId}`);
      }
    } catch (err) {
      this.logger.warn(`Failed to award badges: ${err.message}`);
    }
  }

  /**
   * Persists multiple events in batch with validation
   */
  private async persistEvents(sessionId: string, events: any[]) {
    // Note: Validation happens in QuickCommandParser for now
    // Add DTO validation here in future if needed

    // [MICROPATCH] Normalize events to ensure consistent eventType/payload
    const normalized = normalizeEventsToWrite(events);

    if (events.length !== normalized.length) {
      this.logger.debug(
        `Normalized events dropped invalid items: ${events.length} received -> ${normalized.length} valid`,
      );
    }

    if (normalized.length === 0) return;

    await this.prisma.session_events.createMany({
      data: normalized.map((e) => ({
        id: uuid(),
        reading_session_id: sessionId,
        event_type: e.eventType as any,
        payload_json: e.payloadJson,
        created_at: new Date(), // Add created_at since schema probably requires or uses it
      })),
    });

    // Emit event to trigger vocab capture and other listeners
    this.eventEmitter.emit("session.events.created", {
      sessionId,
      eventTypes: normalized.map((e) => e.eventType),
    });
  }

  /**
   * Get user's reading sessions with pagination and filters
   * Reuses patterns from SearchService and admin controllers
   */
  async getUserSessions(user_id: string, dto: SessionsQueryDto) {
    const page = dto.page || 1;
    const limit = Math.min(dto.limit || 20, 100);
    const skip = (page - 1) * limit;

    // Build where clause (SAME pattern as SearchService)
    const where: Prisma.reading_sessionsWhereInput = {
      user_id,
    };

    // Date filters (SAME pattern as admin/dashboard.controller.ts)
    if (dto.since || dto.until) {
      where.started_at = {};
      if (dto.since) where.started_at.gte = new Date(dto.since);
      if (dto.until) where.started_at.lte = new Date(dto.until);
    }

    if (dto.phase) {
      where.phase = dto.phase;
    }

    // Search in content title (SAME pattern as SearchService)
    if (dto.query) {
      where.contents = {
        title: { contains: dto.query, mode: "insensitive" },
      };
    }

    // Count total for pagination
    const total = await this.prisma.reading_sessions.count({ where });

    // Fetch sessions
    const sessions = await this.prisma.reading_sessions.findMany({
      where,
      include: {
        contents: {
          select: { id: true, title: true, type: true },
        },
        _count: {
          select: { session_events: true },
        },
      },
      orderBy:
        dto.sortBy === "duration"
          ? [{ finished_at: dto.sortOrder }]
          : [{ started_at: dto.sortOrder }],
      skip,
      take: limit,
    });

    return {
      sessions: sessions.map((s) => this.transformToSessionSummary(s)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Transform session to summary format
   */
  private transformToSessionSummary(session: any) {
    const duration = session.finished_at
      ? Math.round(
          (session.finished_at.getTime() - session.started_at.getTime()) /
            60000,
        )
      : null;

    return {
      id: session.id,
      started_at: session.started_at.toISOString(),
      finished_at: session.finished_at?.toISOString() || null,
      duration,
      phase: session.phase,
      content: {
        id: session.contents.id,
        title: session.contents.title,
        type: session.contents.type,
      },
      eventsCount: session._count?.session_events || 0,
    };
  }

  /**
   * Export user sessions to CSV/JSON
   * For LGPD/compliance data export
   */
  async exportSessions(user_id: string, format: "csv" | "json") {
    const sessions = await this.prisma.reading_sessions.findMany({
      where: { user_id },
      include: {
        contents: {
          select: { id: true, title: true, type: true },
        },
        _count: {
          select: { session_events: true },
        },
      },
      orderBy: { started_at: "desc" },
    });

    const data = sessions.map((s) => this.transformToSessionSummary(s));

    if (format === "json") {
      return { data, count: sessions.length };
    }

    // CSV format
    const headers = [
      "ID",
      "Started At",
      "Finished At",
      "Duration (min)",
      "Phase",
      "Content Title",
      "Content Type",
      "Events Count",
    ];
    const rows = data.map((s) => [
      s.id,
      s.started_at,
      s.finished_at || "N/A",
      s.duration?.toString() || "N/A",
      s.phase,
      s.content.title,
      s.content.type,
      s.eventsCount.toString(),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    return { csv, count: sessions.length };
  }

  /**
   * Get activity analytics for charts
   */
  async getActivityAnalytics(user_id: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sessions = await this.prisma.reading_sessions.findMany({
      where: {
        user_id,
        started_at: { gte: startDate },
      },
      select: {
        started_at: true,
        finished_at: true,
        phase: true,
      },
      orderBy: { started_at: "asc" },
    });

    // Group by date
    const activityByDate: Record<string, { count: number; minutes: number }> =
      {};

    sessions.forEach((s) => {
      const dateKey = s.started_at.toISOString().split("T")[0];
      if (!activityByDate[dateKey]) {
        activityByDate[dateKey] = { count: 0, minutes: 0 };
      }
      activityByDate[dateKey].count++;

      if (s.finished_at) {
        const duration = Math.round(
          (s.finished_at.getTime() - s.started_at.getTime()) / 60000,
        );
        activityByDate[dateKey].minutes += duration;
      }
    });

    // Phase distribution
    const phaseDistribution = {
      PRE: sessions.filter((s) => s.phase === "PRE").length,
      DURING: sessions.filter((s) => s.phase === "DURING").length,
      POST: sessions.filter((s) => s.phase === "POST").length,
    };

    return {
      activityByDate,
      phaseDistribution,
      totalSessions: sessions.length,
      periodDays: days,
    };
  }

  // ============================================
  // Phase 3: Resume Logic & Bookmarks
  // ============================================

  async getReadingProgress(user_id: string, content_id: string) {
    return this.getReadingProgressUseCase.execute(user_id, content_id);
  }

  async updateReadingProgress(
    user_id: string,
    content_id: string,
    dto: UpdateReadingProgressDto,
  ) {
    return this.updateReadingProgressUseCase.execute(user_id, content_id, dto);
  }

  async getBookmarks(user_id: string, content_id: string) {
    return this.getBookmarksUseCase.execute(user_id, content_id);
  }

  async createBookmark(
    user_id: string,
    content_id: string,
    dto: CreateBookmarkDto,
  ) {
    return this.createBookmarkUseCase.execute(user_id, content_id, dto);
  }

  async deleteBookmark(bookmarkId: string, user_id: string) {
    return this.deleteBookmarkUseCase.execute(bookmarkId, user_id);
  }

  /**
   * Get recent session statistics for signal enrichment
   * Used by Learning Orchestrator to calculate context signals
   */
  async getRecentSessionStats(
    sessionId: string,
    minutes: number = 15,
  ): Promise<{ doubtsCount: number; timeSpent: number }> {
    const since = new Date(Date.now() - minutes * 60 * 1000);

    // Count doubt-related events in the time window
    const doubtsCount = await this.prisma.session_events.count({
      where: {
        reading_session_id: sessionId,
        created_at: { gte: since },
        event_type: 'MARK_UNKNOWN_WORD', // Primary doubt signal
      },
    });

    // Calculate time spent (approximate from event timestamps)
    const events = await this.prisma.session_events.findMany({
      where: {
        reading_session_id: sessionId,
        created_at: { gte: since },
      },
      select: { created_at: true },
      orderBy: { created_at: 'asc' },
    });

    const timeSpent =
      events.length > 1
        ? Math.floor(
            (events[events.length - 1].created_at.getTime() -
              events[0].created_at.getTime()) /
              (1000 * 60),
          )
        : 0;

    return { doubtsCount, timeSpent };
  }
}
