import { EducationLevel } from "@prisma/client";

export class Profile {
  userId: string; // PK
  educationLevel: EducationLevel;
  dailyTimeBudgetMin: number;
  dailyReviewCap: number;
  readingLevelScore?: number;
  listeningLevelScore?: number;
  writingLevelScore?: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<Profile>) {
    Object.assign(this, partial);
  }
}
