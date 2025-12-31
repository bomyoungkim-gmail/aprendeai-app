import { PrismaService } from "../prisma/prisma.service";
import { ProfileService } from "../profiles/profile.service";
import { GamificationService } from "../gamification/gamification.service";
import { VocabService } from "../vocab/vocab.service";
import { OutcomesService } from "../outcomes/outcomes.service";
import { GatingService } from "../gating/gating.service";
import { PrePhaseDto } from "./dto/reading-sessions.dto";
import { StartSessionDto, FinishSessionDto } from "./dto/start-session.dto";
import { PromptMessageDto } from "./dto/prompt-message.dto";
import { AgentTurnResponseDto } from "./dto/agent-turn-response.dto";
import { QuickCommandParser } from "./parsers/quick-command.parser";
import { AiServiceClient } from "../ai-service/ai-service.client";
import { ActivityService } from "../activity/activity.service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { SessionsQueryDto } from "./dto/sessions-query.dto";
import { Prisma } from "@prisma/client";
import { ProviderUsageService } from "../observability/provider-usage.service";
import { StartSessionUseCase } from "./application/use-cases/start-session.use-case";
import { GetSessionUseCase } from "./application/use-cases/get-session.use-case";
import { UpdatePrePhaseUseCase } from "./application/use-cases/update-pre-phase.use-case";
import { AdvancePhaseUseCase } from "./application/use-cases/advance-phase.use-case";
import { RecordEventUseCase } from "./application/use-cases/record-event.use-case";
export declare class ReadingSessionsService {
    private prisma;
    private profileService;
    private gamificationService;
    private vocabService;
    private outcomesService;
    private gatingService;
    private quickCommandParser;
    private aiServiceClient;
    private providerUsageService;
    private activityService;
    private eventEmitter;
    private startSessionUseCase;
    private getSessionUseCase;
    private updatePrePhaseUseCase;
    private advancePhaseUseCase;
    private recordEventUseCase;
    private readonly logger;
    constructor(prisma: PrismaService, profileService: ProfileService, gamificationService: GamificationService, vocabService: VocabService, outcomesService: OutcomesService, gatingService: GatingService, quickCommandParser: QuickCommandParser, aiServiceClient: AiServiceClient, providerUsageService: ProviderUsageService, activityService: ActivityService, eventEmitter: EventEmitter2, startSessionUseCase: StartSessionUseCase, getSessionUseCase: GetSessionUseCase, updatePrePhaseUseCase: UpdatePrePhaseUseCase, advancePhaseUseCase: AdvancePhaseUseCase, recordEventUseCase: RecordEventUseCase);
    startSession(user_id: string, content_id: string): Promise<import("./domain/reading-session.entity").ReadingSession & {
        minTargetWords: number;
    }>;
    getSession(sessionId: string, user_id: string): Promise<any>;
    updatePrePhase(sessionId: string, user_id: string, data: PrePhaseDto): Promise<import("./domain/reading-session.entity").ReadingSession>;
    recordEvent(sessionId: string, event_type: string, payload: any): Promise<import("./domain/reading-session.entity").SessionEvent>;
    advancePhase(sessionId: string, user_id: string, toPhase: "POST" | "FINISHED"): Promise<import("./domain/reading-session.entity").ReadingSession>;
    private validatePostCompletion;
    private computeOutcome;
    private integrateWithGamification;
    private getMinTargetWords;
    startSessionPromptOnly(user_id: string, dto: StartSessionDto): Promise<{
        reading_session_id: string;
        threadId: string;
        nextPrompt: string;
    }>;
    private enrichPromptContext;
    processPrompt(sessionId: string, dto: PromptMessageDto, user_id: string): Promise<AgentTurnResponseDto>;
    finishSessionPromptOnly(sessionId: string, user_id: string, dto: FinishSessionDto): Promise<{
        ok: boolean;
        session: {
            id: string;
            content_id: string;
            content_version_id: string | null;
            user_id: string;
            phase: import(".prisma/client").$Enums.SessionPhase | null;
            started_at: Date;
            finished_at: Date | null;
            modality: import(".prisma/client").$Enums.SessionModality | null;
            asset_layer: string | null;
            goal_statement: string | null;
            prediction_text: string | null;
            target_words_json: Prisma.JsonValue | null;
        };
    }>;
    private persistEvents;
    getUserSessions(user_id: string, dto: SessionsQueryDto): Promise<{
        sessions: {
            id: any;
            started_at: any;
            finished_at: any;
            duration: number;
            phase: any;
            content: {
                id: any;
                title: any;
                type: any;
            };
            eventsCount: any;
        }[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    private transformToSessionSummary;
    exportSessions(user_id: string, format: "csv" | "json"): Promise<{
        data: {
            id: any;
            started_at: any;
            finished_at: any;
            duration: number;
            phase: any;
            content: {
                id: any;
                title: any;
                type: any;
            };
            eventsCount: any;
        }[];
        count: number;
        csv?: undefined;
    } | {
        csv: string;
        count: number;
        data?: undefined;
    }>;
    getActivityAnalytics(user_id: string, days?: number): Promise<{
        activityByDate: Record<string, {
            count: number;
            minutes: number;
        }>;
        phaseDistribution: {
            PRE: number;
            DURING: number;
            POST: number;
        };
        totalSessions: number;
        periodDays: number;
    }>;
}
