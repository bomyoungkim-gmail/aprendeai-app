import { StudySession } from "./study-session.entity";
export interface IAnalyticsRepository {
    createSession(session: StudySession): Promise<StudySession>;
    updateSession(id: string, updates: Partial<StudySession>): Promise<StudySession>;
    incrementInterruptions(id: string): Promise<void>;
    findById(id: string): Promise<StudySession | null>;
    findActiveSession(userId: string, activityType?: string): Promise<StudySession | null>;
    findAbandonedSessions(thresholdMinutes: number): Promise<StudySession[]>;
    findReadingSession(userId: string, contentId: string): Promise<StudySession | null>;
    countMasteredVocab(userId: string, minMastery: number): Promise<number>;
    getAssessmentAnswers(userId: string): Promise<any[]>;
    getVocabularyList(userId: string, limit: number): Promise<any[]>;
    getHourlyPerformance(userId: string, since: Date): Promise<any[]>;
    getQualitySessions(userId: string, since: Date): Promise<any[]>;
}
export declare const IAnalyticsRepository: unique symbol;
