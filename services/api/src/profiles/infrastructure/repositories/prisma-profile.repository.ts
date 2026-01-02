import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { IProfileRepository } from "../../domain/profile.repository.interface";
import { Profile } from "../../domain/profile.entity";

@Injectable()
export class PrismaProfileRepository implements IProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<Profile | null> {
    const found = await this.prisma.learner_profiles.findUnique({
      where: { user_id: userId },
    });
    return found ? this.mapToDomain(found) : null;
  }

  async create(data: Partial<Profile>): Promise<Profile> {
    const created = await this.prisma.learner_profiles.create({
      data: {
        user_id: data.userId!,
        education_level: data.educationLevel!,
        daily_time_budget_min: data.dailyTimeBudgetMin || 30,
        reading_level_score: data.readingLevelScore,
        listening_level_score: data.listeningLevelScore,
        writing_level_score: data.writingLevelScore,
        updated_at: new Date(),
      },
    });
    return this.mapToDomain(created);
  }

  async update(userId: string, data: Partial<Profile>): Promise<Profile> {
    const updated = await this.prisma.learner_profiles.update({
      where: { user_id: userId },
      data: {
        education_level: data.educationLevel,
        daily_time_budget_min: data.dailyTimeBudgetMin,
        reading_level_score: data.readingLevelScore,
        listening_level_score: data.listeningLevelScore,
        writing_level_score: data.writingLevelScore,
      },
    });
    return this.mapToDomain(updated);
  }

  private mapToDomain(item: any): Profile {
    return new Profile({
      userId: item.user_id,
      educationLevel: item.education_level,
      dailyTimeBudgetMin: item.daily_time_budget_min,
      dailyReviewCap: item.daily_review_cap,
      readingLevelScore: item.reading_level_score,
      listeningLevelScore: item.listening_level_score,
      writingLevelScore: item.writing_level_score,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    });
  }
}
