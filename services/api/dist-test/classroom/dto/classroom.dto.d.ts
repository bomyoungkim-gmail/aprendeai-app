export declare class CreateClassroomDto {
    ownerEducatorUserId: string;
    name: string;
    institutionId?: string;
    gradeLevel?: string;
}
export declare class UpdateClassroomDto {
    name?: string;
    gradeLevel?: string;
}
export declare class EnrollStudentDto {
    classroomId?: string;
    learnerUserId: string;
    nickname?: string;
}
export declare class CreateClassPolicyDto {
    classroomId?: string;
    weeklyUnitsTarget?: number;
    timeboxDefaultMin?: number;
    dailyReviewCap?: number;
    privacyMode?: "AGGREGATED_ONLY" | "AGGREGATED_PLUS_HELP_REQUESTS" | "AGGREGATED_PLUS_FLAGS";
    interventionMode?: "PROMPT_COACH" | "PROMPT_COACH_PLUS_1ON1";
}
export declare class CreateWeeklyPlanDto {
    weekStart: Date;
    items: string[];
    toolWords?: string[];
}
export declare class LogInterventionDto {
    learnerUserId: string;
    topic: string;
}
export declare class GetPolicyPromptDto {
    units: number;
    minutes: number;
}
export declare class GetWeeklyPlanPromptDto {
    unitsTarget: number;
}
export declare class GetInterventionPromptDto {
    studentName: string;
    topic: string;
}
export declare class GetDashboardPromptDto {
    activeCount: number;
    avgComprehension: number;
}
