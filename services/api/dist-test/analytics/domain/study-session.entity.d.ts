export declare class StudySession {
    id: string;
    userId: string;
    activityType: string;
    contentId?: string | null;
    sourceId?: string | null;
    startTime: Date;
    endTime?: Date | null;
    durationMinutes?: number | null;
    netFocusMinutes?: number | null;
    interruptions?: number | null;
    focusScore?: number | null;
    accuracyRate?: number | null;
    engagementScore?: number | null;
    constructor(partial: Partial<StudySession>);
    isFinished(): boolean;
}
