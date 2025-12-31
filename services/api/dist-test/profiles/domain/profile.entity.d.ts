import { EducationLevel } from "@prisma/client";
export declare class Profile {
    userId: string;
    educationLevel: EducationLevel;
    dailyTimeBudgetMin: number;
    dailyReviewCap: number;
    readingLevelScore?: number;
    listeningLevelScore?: number;
    writingLevelScore?: number;
    createdAt: Date;
    updatedAt: Date;
    constructor(partial: Partial<Profile>);
}
