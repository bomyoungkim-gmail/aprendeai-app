import { DailyGoalType } from "@prisma/client";
export declare class SetDailyGoalDto {
    goalType: DailyGoalType;
    goalValue: number;
}
export declare class ActivityProgressDto {
    minutesSpentDelta?: number;
    lessonsCompletedDelta?: number;
    focusScore?: number;
    accuracyRate?: number;
    activityType?: string;
}
