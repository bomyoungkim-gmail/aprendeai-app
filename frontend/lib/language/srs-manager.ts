/**
 * SRS Manager for LANGUAGE Mode
 * 
 * Domain logic (pure) - no React dependencies
 * Following MelhoresPraticas.txt: domain logic in lib/
 * 
 * G6.2: SRS automático com limite de 20 palavras/sessão
 */

export interface SRSCard {
  word: string;
  definition: string;
  context: string;
  contentId: string;
  addedAt: Date;
  reviewCount: number;
  nextReviewAt: Date;
}

export const MAX_SRS_WORDS_PER_SESSION = 20;

export class SRSManager {
  private sessionCount: number = 0;

  /**
   * Check if word can be added to SRS (under session limit)
   */
  canAddWord(): boolean {
    return this.sessionCount < MAX_SRS_WORDS_PER_SESSION;
  }

  /**
   * Get remaining slots for this session
   */
  getRemainingSlots(): number {
    return Math.max(0, MAX_SRS_WORDS_PER_SESSION - this.sessionCount);
  }

  /**
   * Increment session count
   */
  incrementCount(): void {
    this.sessionCount++;
  }

  /**
   * Reset session count (e.g., on new content)
   */
  resetSession(): void {
    this.sessionCount = 0;
  }

  /**
   * Create SRS card from word and definition
   */
  createCard(
    word: string,
    definition: string,
    context: string,
    contentId: string
  ): SRSCard {
    return {
      word,
      definition,
      context,
      contentId,
      addedAt: new Date(),
      reviewCount: 0,
      nextReviewAt: this.calculateNextReview(0)
    };
  }

  /**
   * Calculate next review date using spaced repetition algorithm
   * Simple SM-2 algorithm
   */
  private calculateNextReview(reviewCount: number): Date {
    const intervals = [1, 3, 7, 14, 30, 60]; // days
    const intervalIndex = Math.min(reviewCount, intervals.length - 1);
    const daysUntilReview = intervals[intervalIndex];

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + daysUntilReview);
    return nextReview;
  }

  /**
   * Check if word is already known (would integrate with backend)
   */
  isKnown(word: string, knownWords: Set<string>): boolean {
    return knownWords.has(word.toLowerCase());
  }
}
