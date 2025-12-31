import { PrismaService } from "../prisma/prisma.service";
import { TrackStudySessionUseCase } from "./application/use-cases/track-study-session.use-case";
export interface SessionStartedEvent {
    user_id: string;
    activity_type: "reading" | "game" | "assessment" | "extension_clip";
    content_id?: string;
    source_id?: string;
}
export interface SessionFinishedEvent {
    sessionId: string;
    duration_minutes?: number;
    net_focus_minutes?: number;
    interruptions?: number;
    accuracy_rate?: number;
    engagement_score?: number;
}
export interface SessionHeartbeatEvent {
    sessionId: string;
    status: "focused" | "blurred";
}
export declare class SessionTrackingService {
    private readonly prisma;
    private readonly trackUseCase;
    private readonly logger;
    constructor(prisma: PrismaService, trackUseCase: TrackStudySessionUseCase);
    handleSessionStart(event: SessionStartedEvent): Promise<import("./domain/study-session.entity").StudySession>;
    handleSessionFinish(event: SessionFinishedEvent): Promise<import("./domain/study-session.entity").StudySession>;
    handleSessionHeartbeat(event: SessionHeartbeatEvent): Promise<void>;
    handleReadingActivity(event: {
        user_id: string;
        content_id: string;
        activity_type: string;
    }): Promise<void>;
    findActiveSession(user_id: string, activityType?: string): Promise<import("./domain/study-session.entity").StudySession>;
    autoCloseAbandonedSessions(thresholdMinutes?: number): Promise<number>;
}
