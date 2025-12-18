import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileService } from '../profiles/profile.service';
import { SrsService, AttemptResult } from '../srs/srs.service';

export type VocabDimension = 'FORM' | 'MEANING' | 'USE';

@Injectable()
export class ReviewService {
  constructor(
    private prisma: PrismaService,
    private profileService: ProfileService,
    private srsService: SrsService,
  ) {}

  /**
   * Get review queue for user
   * Respects daily cap and returns vocab + cue cards
   */
  async getReviewQueue(userId: string, limit?: number) {
    const profile = await this.profileService.get(userId);
    const cap = limit || profile?.dailyReviewCap || 20;

    // Get vocab items due for review
    const vocabItems = await this.prisma.userVocabulary.findMany({
      where: {
        userId,
        dueAt: { lte: new Date() },
      },
      orderBy: [
        { dueAt: 'asc' },         // Oldest first
        { lapsesCount: 'desc' },  // Struggled items priority
      ],
      take: cap,
      include: {
        content: {
          select: { id: true, title: true },
        },
      },
    });

    // DECISION 3: Skip cue cards in V4, implement in V5
    const cues: any[] = [];

    // Count total due items
    const totalDue = await this.prisma.userVocabulary.count({
      where: {
        userId,
        dueAt: { lte: new Date() },
      },
    });

    return {
      vocab: vocabItems,
      cues,
      stats: {
        totalDue,
        cap,
        vocabCount: vocabItems.length,
        cuesCount: 0,
      },
    };
  }

  /**
   * Record vocab attempt and update SRS
   * DECISION 2: Use transactions for race condition safety
   */
  async recordVocabAttempt(
    vocabId: string,
    dimension: VocabDimension,
    result: AttemptResult,
    sessionId?: string,
  ) {
    const vocab = await this.prisma.userVocabulary.findUnique({
      where: { id: vocabId },
    });

    if (!vocab) {
      throw new Error('Vocabulary item not found');
    }

    const { newStage, dueDate, lapseIncrement } = this.srsService.calculateNextDue(
      vocab.srsStage as any,
      result,
    );

    const masteryDelta = this.srsService.calculateMasteryDelta(result);

    // DECISION 2: ATOMIC TRANSACTION
    await this.prisma.$transaction([
      // Record attempt
      this.prisma.vocabAttempt.create({
        data: {
          vocabId,
          sessionId,
          dimension: dimension as any,
          result: result as any,
        },
      }),

      // Update vocab item
      this.prisma.userVocabulary.update({
        where: { id: vocabId },
        data: {
          srsStage: newStage as any,
          dueAt: dueDate,
          lapsesCount: { increment: lapseIncrement },
          lastSeenAt: new Date(),
          // Update dimension-specific mastery
          ...(dimension === 'FORM' && {
            masteryForm: Math.max(0, Math.min(100, vocab.masteryForm + masteryDelta)),
          }),
          ...(dimension === 'MEANING' && {
            masteryMeaning: Math.max(0, Math.min(100, vocab.masteryMeaning + masteryDelta)),
          }),
          ...(dimension === 'USE' && {
            masteryUse: Math.max(0, Math.min(100, vocab.masteryUse + masteryDelta)),
          }),
        },
      }),
    ]);

    // Return updated vocab
    return this.prisma.userVocabulary.findUnique({
      where: { id: vocabId },
    });
  }

  /**
   * Get cue cards from Cornell Notes
   * DECISION 3: Deferred to V5
   */
  async getCueCards(userId: string) {
    // Placeholder for V5 implementation
    return [];
  }
}
