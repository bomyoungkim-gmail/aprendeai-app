import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface RecommendationContent {
  id: string;
  title: string;
  type: string;
  originalLanguage: string;
  createdAt: Date;
  ownerUser?: { id: string; name: string };
  progress?: number;
  popularity?: number;
}

@Injectable()
export class RecommendationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all recommendations for user
   */
  async getRecommendations(userId: string) {
    const [continueReading, recentReads, popularInGroups, similar, trending] =
      await Promise.all([
        this.getContinueReading(userId),
        this.getRecentReads(userId),
        this.getPopularInGroups(userId),
        this.getSimilarContent(userId),
        this.getTrending(userId),
      ]);

    return {
      continueReading,
      recentReads,
      popularInGroups,
      similar,
      trending,
    };
  }

  /**
   * Get unfinished content to continue reading
   */
  private async getContinueReading(userId: string): Promise<RecommendationContent[]> {
    const sessions = await this.prisma.readingSession.findMany({
      where: {
        userId,
        finishedAt: null,
      },
      include: {
        content: {
          include: {
            ownerUser: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: 3,
    });

    return sessions.map((session) => ({
      ...session.content,
      progress: this.calculateProgress(session),
    }));
  }

  /**
   * Get recently read content
   */
  private async getRecentReads(userId: string): Promise<RecommendationContent[]> {
    const sessions = await this.prisma.readingSession.findMany({
      where: {
        userId,
        finishedAt: { not: null },
      },
      include: {
        content: {
          include: {
            ownerUser: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { finishedAt: 'desc' },
      take: 10,
    });

    // Get unique content
    const seen = new Set<string>();
    const unique = sessions.filter((session) => {
      if (seen.has(session.contentId)) return false;
      seen.add(session.contentId);
      return true;
    });

    return unique.map((session) => session.content);
  }

  /**
   * Get popular content in user's groups
   */
  private async getPopularInGroups(userId: string): Promise<RecommendationContent[]> {
    // Get user's active groups
    const memberships = await this.prisma.studyGroupMember.findMany({
      where: { userId, status: 'ACTIVE' },
      select: { groupId: true },
    });

    const groupIds = memberships.map((m) => m.groupId);

    if (groupIds.length === 0) return [];

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get content from those groups with session counts
    const popularContent = await this.prisma.content.findMany({
      where: {
        groupContents: {
          some: { groupId: { in: groupIds } },
        },
        ReadingSession: {
          some: {
            startedAt: { gte: thirtyDaysAgo },
          },
        },
      },
      include: {
        ownerUser: {
          select: { id: true, name: true },
        },
        ReadingSession: {
          where: {
            userId: { not: userId }, // Exclude user's own sessions
            startedAt: { gte: thirtyDaysAgo },
          },
          select: { id: true, startedAt: true },
        },
      },
    });

    // Sort by popularity with time decay
    const scored = popularContent
      .map((content) => ({
        ...content,
        popularity: this.calculatePopularity(content.ReadingSession),
      }))
      .filter((c) => c.ReadingSession.length > 0) // Must have reads
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 5);

    // Remove ReadingSession from response
    return scored.map(({ ReadingSession, popularity, ...content }) => ({
      ...content,
      popularity,
    }));
  }

  /**
   * Get content similar to what user recently read
   */
  private async getSimilarContent(userId: string): Promise<RecommendationContent[]> {
    // Get user's recent reads to understand preferences
    const recentSessions = await this.prisma.readingSession.findMany({
      where: { userId },
      include: {
        content: {
          select: { type: true, originalLanguage: true },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: 5,
    });

    if (recentSessions.length === 0) return [];

    // Extract unique types and languages
    const types = [...new Set(recentSessions.map((s) => s.content.type))];
    const languages = [...new Set(recentSessions.map((s) => s.content.originalLanguage))];

    // Get content IDs user has already read
    const readContentIds = await this.prisma.readingSession.findMany({
      where: { userId },
      select: { contentId: true },
      distinct: ['contentId'],
    });

    const readIds = readContentIds.map((s) => s.contentId);

    // Find similar unread content
    const similar = await this.prisma.content.findMany({
      where: {
        type: { in: types },
        originalLanguage: { in: languages },
        id: { notIn: readIds },
      },
      include: {
        ownerUser: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return similar;
  }

  /**
   * Get trending content platform-wide
   */
  private async getTrending(userId: string): Promise<RecommendationContent[]> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get content IDs user has already read
    const readContentIds = await this.prisma.readingSession.findMany({
      where: { userId },
      select: { contentId: true },
      distinct: ['contentId'],
    });

    const readIds = readContentIds.map((s) => s.contentId);

    // Get trending content
    const trending = await this.prisma.content.findMany({
      where: {
        id: { notIn: readIds },
        ReadingSession: {
          some: { startedAt: { gte: sevenDaysAgo } },
        },
      },
      include: {
        ownerUser: {
          select: { id: true, name: true },
        },
        ReadingSession: {
          where: { startedAt: { gte: sevenDaysAgo } },
          select: { id: true, startedAt: true },
        },
      },
    });

    // Filter by minimum reads and calculate popularity
    const popularTrending = trending
      .filter((c) => c.ReadingSession.length >= 5) // Minimum 5 reads to be trending
      .map((content) => ({
        ...content,
        popularity: this.calculatePopularity(content.ReadingSession),
      }))
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 5);

    // Remove ReadingSession from response
    return popularTrending.map(({ ReadingSession, popularity, ...content }) => ({
      ...content,
      popularity,
    }));
  }

  /**
   * Calculate reading progress percentage
   */
  private calculateProgress(session: any): number {
    const duration = Date.now() - new Date(session.startedAt).getTime();
    const estimatedDuration = 30 * 60 * 1000; // 30 minutes estimate
    return Math.min(Math.round((duration / estimatedDuration) * 100), 90);
  }

  /**
   * Calculate popularity score with time decay
   */
  private calculatePopularity(sessions: { startedAt: Date }[]): number {
    const now = Date.now();
    return sessions.reduce((score, session) => {
      const ageInDays =
        (now - new Date(session.startedAt).getTime()) / (24 * 60 * 60 * 1000);
      const decay = Math.exp(-ageInDays / 7); // Exponential decay over 7 days
      return score + decay;
    }, 0);
  }
}
