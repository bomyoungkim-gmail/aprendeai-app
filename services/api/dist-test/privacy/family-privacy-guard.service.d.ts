import { PrivacyMode, EducatorDashboardData } from "./types";
export declare class FamilyPrivacyGuard {
    private readonly logger;
    filterDashboardData(data: EducatorDashboardData, privacyMode: PrivacyMode): EducatorDashboardData;
    private sanitizeAlerts;
    canViewField(field: keyof EducatorDashboardData, privacyMode: PrivacyMode): boolean;
    maskTextualContent(text: string): string;
}
