import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  IRecommendationRepository,
  RecommendationContent,
} from "../../domain/interfaces/recommendation.repository.interface";

@Injectable()
export class PrismaRecommendationRepository implements IRecommendationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getContinueReading(userId: string): Promise<RecommendationContent[]> {
    const sessions = await this.prisma.reading_sessions.findMany({
      where: {
        user_id: userId,
        finished_at: null,
      },
      include: {
        contents: {
          include: {
            users_owner: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { started_at: "desc" },
      take: 3,
    });

    return sessions.map((session) => ({
      ...(session.contents as any),
      progress: this.calculateProgress(session),
    }));
  }

  async getRecentReads(userId: string): Promise<RecommendationContent[]> {
    const sessions = await this.prisma.reading_sessions.findMany({
      where: {
        user_id: userId,
        finished_at: { not: null },
      },
      include: {
        contents: {
          include: {
            users_owner: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { finished_at: "desc" },
      take: 10,
    });

    // Get unique content
    const seen = new Set<string>();
    const unique = sessions.filter((session) => {
      if (seen.has(session.content_id)) return false;
      seen.add(session.content_id);
      return true;
    });

    return unique.map((session) => session.contents as any);
  }

  async getPopularInGroups(
    userId: string,
    groupIds: string[],
  ): Promise<RecommendationContent[]> {
    if (groupIds.length === 0) return [];

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const popularContent = await this.prisma.contents.findMany({
      where: {
        content_shares: {
          some: { context_id: { in: groupIds }, context_type: "STUDY_GROUP" },
        },
        reading_sessions: {
          some: {
            started_at: { gte: thirtyDaysAgo },
          },
        },
      },
      include: {
        users_owner: {
          select: { id: true, name: true },
        },
        reading_sessions: {
          where: {
            user_id: { not: userId },
            started_at: { gte: thirtyDaysAgo },
          },
          select: { id: true, started_at: true },
        },
      },
    });

    const scored = popularContent
      .map((content) => ({
        ...content,
        popularity: this.calculatePopularityScore(content.reading_sessions),
      }))
      .filter((c) => c.reading_sessions.length > 0)
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 5);

    return scored.map(({ reading_sessions, popularity, ...content }) => ({
      ...content,
      popularity,
    })) as any;
  }

  async getSimilarContent(
    userId: string,
    types: string[],
    languages: string[],
    readIds: string[],
  ): Promise<RecommendationContent[]> {
    const similar = await this.prisma.contents.findMany({
      where: {
        type: { in: types as any[] },
        original_language: { in: languages as any[] },
        id: { notIn: readIds },
      },
      include: {
        users_owner: {
          select: { id: true, name: true },
        },
      },
      orderBy: { created_at: "desc" },
      take: 5,
    });

    return similar as any;
  }

  async getTrending(
    userId: string,
    readIds: string[],
  ): Promise<RecommendationContent[]> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const trending = await this.prisma.contents.findMany({
      where: {
        id: { notIn: readIds },
        reading_sessions: {
          some: { started_at: { gte: sevenDaysAgo } },
        },
      },
      include: {
        users_owner: {
          select: { id: true, name: true },
        },
        reading_sessions: {
          where: { started_at: { gte: sevenDaysAgo } },
          select: { id: true, started_at: true },
        },
      },
    });

    const popularTrending = trending
      .filter((c) => c.reading_sessions.length >= 5)
      .map((content) => ({
        ...content,
        popularity: this.calculatePopularityScore(content.reading_sessions),
      }))
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 5);

    return popularTrending.map(
      ({ reading_sessions, popularity, ...content }) =>
        ({
          ...content,
          popularity,
        }) as any,
    );
  }

  private calculateProgress(session: any): number {
    const duration = Date.now() - new Date(session.started_at).getTime();
    const estimatedDuration = 30 * 60 * 1000;
    return Math.min(Math.round((duration / estimatedDuration) * 100), 90);
  }

  private calculatePopularityScore(sessions: { started_at: Date }[]): number {
    const now = Date.now();
    return sessions.reduce((score, session) => {
      const ageInDays =
        (now - new Date(session.started_at).getTime()) / (24 * 60 * 60 * 1000);
      const decay = Math.exp(-ageInDays / 7);
      return score + decay;
    }, 0);
  }
}
