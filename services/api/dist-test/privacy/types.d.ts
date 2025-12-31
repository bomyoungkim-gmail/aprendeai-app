export declare enum PrivacyMode {
    AGGREGATED_ONLY = "AGGREGATED_ONLY",
    AGGREGATED_PLUS_TRIGGERS = "AGGREGATED_PLUS_TRIGGERS"
}
export declare enum ClassPrivacyMode {
    AGGREGATED_ONLY = "AGGREGATED_ONLY",
    AGGREGATED_PLUS_HELP_REQUESTS = "AGGREGATED_PLUS_HELP_REQUESTS",
    AGGREGATED_PLUS_FLAGS = "AGGREGATED_PLUS_FLAGS"
}
export interface EducatorDashboardData {
    streakDays?: number;
    minutesTotal?: number;
    comprehensionAvg?: number;
    comprehensionTrend?: "UP" | "DOWN" | "FLAT";
    topBlockers?: string[];
    alerts?: Alert[];
    detailedLogs?: any[];
    textualContent?: string;
}
export interface Alert {
    type: string;
    severity: "LOW" | "MED" | "HIGH";
    message?: string;
}
export interface StudentData {
    learnerUserId: string;
    nickname?: string;
    progressPercent?: number;
    lastActivityDate?: Date;
    comprehensionScore?: number;
    helpRequests?: any[];
    struggles?: string[];
}
