"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ReadingSessionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReadingSessionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const profile_service_1 = require("../profiles/profile.service");
const gamification_service_1 = require("../gamification/gamification.service");
const vocab_service_1 = require("../vocab/vocab.service");
const outcomes_service_1 = require("../outcomes/outcomes.service");
const gating_service_1 = require("../gating/gating.service");
const quick_command_parser_1 = require("./parsers/quick-command.parser");
const ai_service_client_1 = require("../ai-service/ai-service.client");
const activity_service_1 = require("../activity/activity.service");
const event_emitter_1 = require("@nestjs/event-emitter");
const uuid_1 = require("uuid");
const provider_usage_service_1 = require("../observability/provider-usage.service");
const start_session_use_case_1 = require("./application/use-cases/start-session.use-case");
const get_session_use_case_1 = require("./application/use-cases/get-session.use-case");
const update_pre_phase_use_case_1 = require("./application/use-cases/update-pre-phase.use-case");
const advance_phase_use_case_1 = require("./application/use-cases/advance-phase.use-case");
const record_event_use_case_1 = require("./application/use-cases/record-event.use-case");
let ReadingSessionsService = ReadingSessionsService_1 = class ReadingSessionsService {
    constructor(prisma, profileService, gamificationService, vocabService, outcomesService, gatingService, quickCommandParser, aiServiceClient, providerUsageService, activityService, eventEmitter, startSessionUseCase, getSessionUseCase, updatePrePhaseUseCase, advancePhaseUseCase, recordEventUseCase) {
        this.prisma = prisma;
        this.profileService = profileService;
        this.gamificationService = gamificationService;
        this.vocabService = vocabService;
        this.outcomesService = outcomesService;
        this.gatingService = gatingService;
        this.quickCommandParser = quickCommandParser;
        this.aiServiceClient = aiServiceClient;
        this.providerUsageService = providerUsageService;
        this.activityService = activityService;
        this.eventEmitter = eventEmitter;
        this.startSessionUseCase = startSessionUseCase;
        this.getSessionUseCase = getSessionUseCase;
        this.updatePrePhaseUseCase = updatePrePhaseUseCase;
        this.advancePhaseUseCase = advancePhaseUseCase;
        this.recordEventUseCase = recordEventUseCase;
        this.logger = new common_1.Logger(ReadingSessionsService_1.name);
    }
    async startSession(user_id, content_id) {
        return this.startSessionUseCase.execute(user_id, content_id);
    }
    async getSession(sessionId, user_id) {
        return this.getSessionUseCase.execute(sessionId, user_id);
    }
    async updatePrePhase(sessionId, user_id, data) {
        return this.updatePrePhaseUseCase.execute(sessionId, user_id, data);
    }
    async recordEvent(sessionId, event_type, payload) {
        return this.recordEventUseCase.execute(sessionId, event_type, payload);
    }
    async advancePhase(sessionId, user_id, toPhase) {
        const updated = await this.advancePhaseUseCase.execute(sessionId, user_id, toPhase);
        if (toPhase === "FINISHED") {
            await this.integrateWithGamification(updated);
            if (updated.targetWordsJson &&
                Array.isArray(updated.targetWordsJson) &&
                updated.targetWordsJson.length > 0) {
                try {
                    this.logger.log(`Auto-creating vocab from ${updated.targetWordsJson.length} target words for session ${sessionId}`);
                    await this.vocabService.createFromTargetWords(sessionId);
                }
                catch (vocabError) {
                    this.logger.error(`Failed to create vocabulary for session ${sessionId}:`, vocabError);
                }
            }
            try {
                await this.outcomesService.computeSessionOutcomes(sessionId);
                this.logger.log(`Computed outcomes for session ${sessionId}`);
            }
            catch (outcomesError) {
                this.logger.error(`Failed to compute outcomes for session ${sessionId}:`, outcomesError);
            }
        }
        return updated;
    }
    async validatePostCompletion(sessionId, user_id, content_id) {
        var _a;
        const notes = await this.prisma.cornell_notes.findFirst({
            where: {
                content_id,
                user_id,
            },
        });
        if (!((_a = notes === null || notes === void 0 ? void 0 : notes.summary_text) === null || _a === void 0 ? void 0 : _a.trim())) {
            throw new common_1.BadRequestException("Cornell Notes summary is required to complete the session. Please add a summary in the Cornell Notes section.");
        }
        const hasQuiz = (await this.prisma.session_events.count({
            where: {
                reading_session_id: sessionId,
                event_type: { in: ["QUIZ_RESPONSE", "CHECKPOINT_RESPONSE"] },
            },
        })) > 0;
        if (!hasQuiz) {
            throw new common_1.BadRequestException("At least 1 quiz or checkpoint response is required to complete the session.");
        }
        const hasProduction = (await this.prisma.session_events.count({
            where: {
                reading_session_id: sessionId,
                event_type: "PRODUCTION_SUBMIT",
            },
        })) > 0;
        if (!hasProduction) {
            throw new common_1.BadRequestException("Production text submission is required to complete the session.");
        }
        this.logger.log(`Session ${sessionId} passed DoD validation`);
    }
    async computeOutcome(sessionId) {
        this.logger.log(`Computing outcome for session ${sessionId}`);
        const events = await this.prisma.session_events.findMany({
            where: { reading_session_id: sessionId },
        });
        const quizEvents = events.filter((e) => e.event_type === "QUIZ_RESPONSE" ||
            e.event_type === "CHECKPOINT_RESPONSE");
        const comprehensionScore = quizEvents.length > 0 ? 100 : 0;
        const prodEvents = events.filter((e) => e.event_type === "PRODUCTION_SUBMIT");
        const totalWords = prodEvents.reduce((sum, e) => {
            const payload = e.payload_json;
            return sum + (payload.word_count || 0);
        }, 0);
        const productionScore = Math.min(100, totalWords * 2);
        const unknownWords = events.filter((e) => e.event_type === "MARK_UNKNOWN_WORD").length;
        const frustrationIndex = Math.min(100, unknownWords * 5);
        return this.prisma.session_outcomes.create({
            data: {
                reading_session_id: sessionId,
                comprehension_score: comprehensionScore,
                production_score: productionScore,
                frustration_index: frustrationIndex,
            },
        });
    }
    async integrateWithGamification(session) {
        if (!session.finishedAt && !session.finished_at)
            return;
        const finishedAt = session.finishedAt || session.finished_at;
        const startedAt = session.startTime || session.started_at;
        const durationMinutes = Math.floor((new Date(finishedAt).getTime() -
            new Date(startedAt).getTime()) /
            (1000 * 60));
        this.logger.log(`Registering ${durationMinutes} minutes for user ${session.user_id}`);
        try {
            await this.gamificationService.registerActivity(session.user_id, {
                minutesSpentDelta: durationMinutes,
                lessonsCompletedDelta: 1,
            });
        }
        catch (error) {
            this.logger.error("Failed to register gamification activity", error);
        }
        try {
            await this.activityService.trackActivity(session.user_id, "study", durationMinutes);
            await this.activityService.trackActivity(session.user_id, "session");
        }
        catch (error) {
            this.logger.warn("Failed to track activity metrics", error);
        }
    }
    getMinTargetWords(level) {
        const MIN_WORDS = {
            FUNDAMENTAL_1: 3,
            FUNDAMENTAL_2: 4,
            MEDIO: 6,
            SUPERIOR: 8,
            ADULTO_LEIGO: 5,
        };
        return MIN_WORDS[level] || 5;
    }
    async startSessionPromptOnly(user_id, dto) {
        this.logger.log(`Starting prompt-only session for user ${user_id}, content ${dto.contentId}`);
        const profile = await this.profileService.getOrCreate(user_id);
        const content = await this.prisma.contents.findUnique({
            where: { id: dto.contentId },
        });
        if (!content) {
            throw new common_1.NotFoundException("Content not found");
        }
        const assetLayer = dto.assetLayer ||
            (await this.gatingService.determineLayer(user_id, dto.contentId));
        const session = await this.prisma.reading_sessions.create({
            data: {
                id: (0, uuid_1.v4)(),
                user_id: user_id,
                content_id: dto.contentId,
                phase: "PRE",
                modality: "READING",
                asset_layer: assetLayer,
            },
        });
        const threadId = (0, uuid_1.v4)();
        const nextPrompt = "Meta do dia: em 1 linha, o que você quer entender neste texto?";
        return {
            reading_session_id: session.id,
            threadId,
            nextPrompt,
        };
    }
    async enrichPromptContext(sessionId, user_id, content_id, userText) {
        let pedState = null;
        try {
            const { loadCompactState } = await Promise.resolve().then(() => require("../common/helpers/redis-context.helper"));
            pedState = await loadCompactState(user_id, content_id);
            if (pedState) {
                this.logger.debug(`Loaded compact state for ${user_id}/${content_id}`);
            }
        }
        catch (err) {
            this.logger.warn(`Failed to load compact state: ${err.message}`);
        }
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
        const formattedTurns = lastTurns.reverse().map((event) => {
            var _a, _b, _c;
            return ({
                role: ((_a = event.payloadJson) === null || _a === void 0 ? void 0 : _a.role) || "user",
                text: ((_b = event.payloadJson) === null || _b === void 0 ? void 0 : _b.text) || ((_c = event.payloadJson) === null || _c === void 0 ? void 0 : _c.content) || "",
                timestamp: event.createdAt,
            });
        });
        let contentSlice = "";
        try {
            const content = await this.prisma.contents.findUnique({
                where: { id: content_id },
                select: { raw_text: true },
            });
            if (content === null || content === void 0 ? void 0 : content.raw_text) {
                contentSlice = content.raw_text.substring(0, 12000);
                this.logger.debug(`Content slice: ${contentSlice.length} chars`);
            }
        }
        catch (err) {
            this.logger.warn(`Failed to load content slice: ${err.message}`);
        }
        return {
            pedState: pedState || {},
            lastTurns: formattedTurns,
            contentSlice,
            memoriesTopK: 6,
            contextPlan: {
                prefixVersion: "CANONICAL_PREFIX_V1",
                lastTurnsWindow: 6,
                memoriesTopK: 6,
                contentSliceChars: contentSlice.length,
            },
        };
    }
    async processPrompt(sessionId, dto, user_id) {
        this.logger.log(`Processing prompt for session ${sessionId}`);
        const session = await this.getSession(sessionId, user_id);
        const parsedEvents = this.quickCommandParser.parse(dto.text, dto.metadata);
        if (parsedEvents.length > 0) {
            this.logger.log(`Persisting ${parsedEvents.length} quick command events`);
            await this.persistEvents(sessionId, parsedEvents);
        }
        const enrichedContext = await this.enrichPromptContext(sessionId, user_id, session.session.content_id, dto.text);
        const enrichedDto = Object.assign(Object.assign({}, dto), { metadata: Object.assign(Object.assign(Object.assign({}, dto.metadata), { tenantId: user_id, user_id, content_id: session.session.content_id }), enrichedContext) });
        const aiResponse = await this.aiServiceClient.sendPrompt(enrichedDto);
        if (aiResponse.usage) {
            const [user, familyMember] = await Promise.all([
                this.prisma.users.findUnique({
                    where: { id: user_id },
                    select: { last_institution_id: true },
                }),
                this.prisma.family_members.findFirst({
                    where: { user_id },
                    select: { family_id: true },
                }),
            ]);
            this.providerUsageService.trackUsage({
                provider: "educator_agent",
                operation: "turn",
                tokens: aiResponse.usage.total_tokens,
                promptTokens: aiResponse.usage.prompt_tokens,
                completionTokens: aiResponse.usage.completion_tokens,
                costUsd: aiResponse.usage.cost_est_usd,
                userId: user_id,
                familyId: familyMember === null || familyMember === void 0 ? void 0 : familyMember.family_id,
                institutionId: user === null || user === void 0 ? void 0 : user.last_institution_id,
                feature: "educator_chat",
                metadata: {
                    sessionId,
                    reading_session_id: sessionId,
                    model: "multi-agent-mix",
                },
            });
        }
        if (aiResponse.eventsToWrite && aiResponse.eventsToWrite.length > 0) {
            this.logger.log(`Persisting ${aiResponse.eventsToWrite.length} AI-suggested events`);
            await this.persistEvents(sessionId, aiResponse.eventsToWrite);
            const hasFinishEvent = aiResponse.eventsToWrite.some((e) => e.eventType === "CO_SESSION_FINISHED" ||
                e.eventType === "READING_SESSION_FINISHED");
            if (hasFinishEvent) {
                this.logger.log("Session finished detected, enqueueing memory job");
                try {
                    const { enqueueMemoryJob } = await Promise.resolve().then(() => require("../common/helpers/redis-context.helper"));
                    const outcome = {
                        top_blockers: [],
                        best_intervention: null,
                        vocab_learned: [],
                        phase: session.session.phase,
                    };
                    await enqueueMemoryJob({
                        tenantId: user_id,
                        userId: user_id,
                        contentId: session.session.content_id,
                        sessionOutcome: outcome,
                    });
                }
                catch (err) {
                    this.logger.warn(`Failed to enqueue memory job: ${err.message}`);
                }
            }
        }
        return aiResponse;
    }
    async finishSessionPromptOnly(sessionId, user_id, dto) {
        this.logger.log(`Finishing session ${sessionId}, reason: ${dto.reason}`);
        const session = await this.getSession(sessionId, user_id);
        const updated = await this.prisma.reading_sessions.update({
            where: { id: sessionId },
            data: {
                phase: "FINISHED",
                finished_at: new Date(),
            },
        });
        this.outcomesService.computeSessionOutcomes(sessionId).catch((err) => {
            this.logger.error(`Failed to compute outcomes for ${sessionId}`, err);
        });
        return { ok: true, session: updated };
    }
    async persistEvents(sessionId, events) {
        await this.prisma.session_events.createMany({
            data: events.map((e) => ({
                id: (0, uuid_1.v4)(),
                reading_session_id: sessionId,
                event_type: e.eventType,
                payload_json: e.payloadJson,
                created_at: new Date(),
            })),
        });
        this.eventEmitter.emit("session.events.created", {
            sessionId,
            eventTypes: events.map((e) => e.eventType),
        });
    }
    async getUserSessions(user_id, dto) {
        const page = dto.page || 1;
        const limit = Math.min(dto.limit || 20, 100);
        const skip = (page - 1) * limit;
        const where = {
            user_id,
        };
        if (dto.since || dto.until) {
            where.started_at = {};
            if (dto.since)
                where.started_at.gte = new Date(dto.since);
            if (dto.until)
                where.started_at.lte = new Date(dto.until);
        }
        if (dto.phase) {
            where.phase = dto.phase;
        }
        if (dto.query) {
            where.contents = {
                title: { contains: dto.query, mode: "insensitive" },
            };
        }
        const total = await this.prisma.reading_sessions.count({ where });
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
            orderBy: dto.sortBy === "duration"
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
    transformToSessionSummary(session) {
        var _a, _b;
        const duration = session.finished_at
            ? Math.round((session.finished_at.getTime() - session.started_at.getTime()) /
                60000)
            : null;
        return {
            id: session.id,
            started_at: session.started_at.toISOString(),
            finished_at: ((_a = session.finished_at) === null || _a === void 0 ? void 0 : _a.toISOString()) || null,
            duration,
            phase: session.phase,
            content: {
                id: session.contents.id,
                title: session.contents.title,
                type: session.contents.type,
            },
            eventsCount: ((_b = session._count) === null || _b === void 0 ? void 0 : _b.session_events) || 0,
        };
    }
    async exportSessions(user_id, format) {
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
        const rows = data.map((s) => {
            var _a;
            return [
                s.id,
                s.started_at,
                s.finished_at || "N/A",
                ((_a = s.duration) === null || _a === void 0 ? void 0 : _a.toString()) || "N/A",
                s.phase,
                s.content.title,
                s.content.type,
                s.eventsCount.toString(),
            ];
        });
        const csv = [
            headers.join(","),
            ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
        ].join("\n");
        return { csv, count: sessions.length };
    }
    async getActivityAnalytics(user_id, days = 30) {
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
        const activityByDate = {};
        sessions.forEach((s) => {
            const dateKey = s.started_at.toISOString().split("T")[0];
            if (!activityByDate[dateKey]) {
                activityByDate[dateKey] = { count: 0, minutes: 0 };
            }
            activityByDate[dateKey].count++;
            if (s.finished_at) {
                const duration = Math.round((s.finished_at.getTime() - s.started_at.getTime()) / 60000);
                activityByDate[dateKey].minutes += duration;
            }
        });
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
};
exports.ReadingSessionsService = ReadingSessionsService;
exports.ReadingSessionsService = ReadingSessionsService = ReadingSessionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(10, (0, common_1.Inject)(event_emitter_1.EventEmitter2)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        profile_service_1.ProfileService,
        gamification_service_1.GamificationService,
        vocab_service_1.VocabService,
        outcomes_service_1.OutcomesService,
        gating_service_1.GatingService,
        quick_command_parser_1.QuickCommandParser,
        ai_service_client_1.AiServiceClient,
        provider_usage_service_1.ProviderUsageService,
        activity_service_1.ActivityService,
        event_emitter_1.EventEmitter2,
        start_session_use_case_1.StartSessionUseCase,
        get_session_use_case_1.GetSessionUseCase,
        update_pre_phase_use_case_1.UpdatePrePhaseUseCase,
        advance_phase_use_case_1.AdvancePhaseUseCase,
        record_event_use_case_1.RecordEventUseCase])
], ReadingSessionsService);
//# sourceMappingURL=reading-sessions.service.js.map