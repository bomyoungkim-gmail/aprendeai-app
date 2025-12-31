import { class_policies } from "@prisma/client";
export declare class ClassPolicyMapper {
    static toDto(policy: class_policies | null): {
        id: string;
        classroomId: string;
        timeboxDefaultMin: number;
        weeklyUnitsTarget: number;
        toolWordsGateEnabled: boolean;
        dailyReviewCap: number;
        privacyMode: import(".prisma/client").$Enums.ClassPrivacyMode;
        interventionMode: import(".prisma/client").$Enums.InterventionMode;
        createdAt: Date;
        updatedAt: Date;
    };
}
