import { IAnalyticsRepository } from "../../domain/analytics.repository.interface";
import { StudySession } from "../../domain/study-session.entity";
export declare class TrackStudySessionUseCase {
    private readonly repository;
    private readonly logger;
    constructor(repository: IAnalyticsRepository);
    startSession(userId: string, activityType: string, contentId?: string, sourceId?: string): Promise<StudySession>;
    finishSession(sessionId: string, data: {
        durationMinutes?: number;
        netFocusMinutes?: number;
        interruptions?: number;
        accuracyRate?: number;
        engagementScore?: number;
    }): Promise<StudySession>;
    heartbeat(sessionId: string, status: "focused" | "blurred"): Promise<void>;
    handleReadingActivity(userId: string, contentId: string): Promise<void>;
}
