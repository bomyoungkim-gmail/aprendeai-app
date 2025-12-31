import { family_policies } from "@prisma/client";
export declare class FamilyPolicyMapper {
    static toDto(policy: family_policies): {
        id: string;
        familyId: string;
        learnerUserId: string;
        timeboxDefaultMin: number;
        dailyMinMinutes: number;
        dailyReviewCap: number;
        coReadingDays: number[];
        coReadingTime: string;
        toolWordsGateEnabled: boolean;
        privacyMode: import(".prisma/client").$Enums.PrivacyMode;
        updatedAt: Date;
    };
    static toCollectionDto(policies: family_policies[]): {
        id: string;
        familyId: string;
        learnerUserId: string;
        timeboxDefaultMin: number;
        dailyMinMinutes: number;
        dailyReviewCap: number;
        coReadingDays: number[];
        coReadingTime: string;
        toolWordsGateEnabled: boolean;
        privacyMode: import(".prisma/client").$Enums.PrivacyMode;
        updatedAt: Date;
    }[];
}
