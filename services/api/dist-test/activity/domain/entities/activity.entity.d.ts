export declare class Activity {
    readonly id: string;
    readonly userId: string;
    readonly date: Date;
    readonly minutesStudied: number;
    readonly sessionsCount: number;
    readonly contentsRead: number;
    readonly annotationsCreated: number;
    constructor(id: string, userId: string, date: Date, minutesStudied?: number, sessionsCount?: number, contentsRead?: number, annotationsCreated?: number);
}
export interface ActivityStats {
    totalDays: number;
    activeTopics: number;
    currentStreak: number;
    longestStreak: number;
    avgMinutesPerDay: number;
    thisWeekMinutes: number;
    thisMonthMinutes: number;
}
export interface HeatmapData {
    date: string;
    minutesStudied: number;
    sessionsCount: number;
    contentsRead: number;
    annotationsCreated: number;
}
