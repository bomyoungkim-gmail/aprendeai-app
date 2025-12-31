import { ReadingSessionsService } from "./reading-sessions.service";
import { PrePhaseDto, RecordEventDto, AdvancePhaseDto } from "./dto/reading-sessions.dto";
import { StartSessionDto, FinishSessionDto } from "./dto/start-session.dto";
import { PromptMessageDto } from "./dto/prompt-message.dto";
import { SessionsQueryDto } from "./dto/sessions-query.dto";
export declare class ReadingSessionsController {
    private sessionService;
    constructor(sessionService: ReadingSessionsService);
    startSessionPromptOnly(dto: StartSessionDto, req: any): Promise<{
        reading_session_id: string;
        threadId: string;
        nextPrompt: string;
    }>;
    sendPrompt(sessionId: string, dto: PromptMessageDto, req: any): Promise<import("./dto/agent-turn-response.dto").AgentTurnResponseDto>;
    finishSessionPromptOnly(sessionId: string, dto: FinishSessionDto, req: any): Promise<{
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
            target_words_json: import("@prisma/client/runtime/library").JsonValue | null;
        };
    }>;
    getUserSessions(req: any, query: SessionsQueryDto): Promise<{
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
    exportSessions(req: any, format?: "csv" | "json"): Promise<{
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
    } | {
        data: string;
        filename: string;
    }>;
    getAnalytics(req: any, days?: string): Promise<{
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
    startSession(contentId: string, req: any): Promise<import("./domain/reading-session.entity").ReadingSession & {
        minTargetWords: number;
    }>;
    getSession(id: string, req: any): Promise<any>;
    updatePrePhase(id: string, dto: PrePhaseDto, req: any): Promise<import("./domain/reading-session.entity").ReadingSession>;
    recordEvent(id: string, dto: RecordEventDto): Promise<import("./domain/reading-session.entity").SessionEvent>;
    advancePhase(id: string, dto: AdvancePhaseDto, req: any): Promise<import("./domain/reading-session.entity").ReadingSession>;
    createSessionForContent(contentId: string, req: any): Promise<import("./domain/reading-session.entity").ReadingSession & {
        minTargetWords: number;
    }>;
    getSessionById(id: string, req: any): Promise<any>;
    updateSessionPrePhase(id: string, dto: PrePhaseDto, req: any): Promise<import("./domain/reading-session.entity").ReadingSession>;
    recordSessionEvent(id: string, dto: RecordEventDto): Promise<import("./domain/reading-session.entity").SessionEvent>;
    advanceSessionPhase(id: string, dto: AdvancePhaseDto, req: any): Promise<import("./domain/reading-session.entity").ReadingSession>;
}
