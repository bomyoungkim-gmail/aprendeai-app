export interface IOpsRepository {
    getDailyMinutesSpent(userId: string, date: Date): Promise<number>;
    getLessonsCompletedCount(userId: string, date: Date): Promise<number>;
    getUserPolicy(userId: string): Promise<any>;
    calculateStreak(userId: string): Promise<number>;
    logStudyTime(userId: string, minutes: number): Promise<void>;
}
export declare const IOpsRepository: unique symbol;
