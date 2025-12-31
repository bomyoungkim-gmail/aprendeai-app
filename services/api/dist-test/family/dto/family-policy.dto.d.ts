export declare class CreateFamilyPolicyDto {
    familyId: string;
    learnerUserId: string;
    timeboxDefaultMin?: number;
    dailyMinMinutes?: number;
    dailyReviewCap?: number;
    coReadingDays?: number[];
    coReadingTime?: string;
    toolWordsGateEnabled?: boolean;
    privacyMode?: "AGGREGATED_ONLY" | "AGGREGATED_PLUS_TRIGGERS";
}
export declare class UpdateFamilyPolicyDto {
    timeboxDefaultMin?: number;
    dailyMinMinutes?: number;
    dailyReviewCap?: number;
    coReadingDays?: number[];
    coReadingTime?: string;
    toolWordsGateEnabled?: boolean;
    privacyMode?: "AGGREGATED_ONLY" | "AGGREGATED_PLUS_TRIGGERS";
}
