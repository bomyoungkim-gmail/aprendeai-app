export declare class DailySnapshotDto {
    userId: string;
    date: Date;
    progress: ProgressDto;
    goals: GoalsDto;
    nextTasks: TaskDto[];
}
export declare class ProgressDto {
    minutesToday: number;
    lessonsCompleted: number;
    comprehensionAvg: number;
    streakDays: number;
    goalMet: boolean;
}
export declare class GoalsDto {
    dailyMinutes: number;
    dailyLessons?: number;
    goalType: "MINUTES" | "LESSONS";
}
export declare class TaskDto {
    id: string;
    title: string;
    description: string;
    estimatedMin: number;
    type: "REVIEW" | "CO_READING" | "LESSON" | "ASSESSMENT";
    ctaUrl?: string;
    priority: "HIGH" | "MEDIUM" | "LOW";
}
export declare class ContextCardDto {
    id: string;
    type: "CO_READING" | "REVIEW_DUE" | "WEEKLY_PLAN" | "STREAK_ALERT";
    title: string;
    message: string;
    ctaText: string;
    ctaUrl: string;
    icon?: string;
    color?: string;
}
export declare class LogTimeDto {
    minutes: number;
    activity?: string;
    notes?: string;
}
