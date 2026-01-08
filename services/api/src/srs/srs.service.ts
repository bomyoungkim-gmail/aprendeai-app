import { Injectable } from "@nestjs/common";
import { addDays } from "date-fns";
import { PrismaService } from "../prisma/prisma.service";
import { Language } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

export type SrsStage =
  | "NEW"
  | "D1"
  | "D3"
  | "D7"
  | "D14"
  | "D30"
  | "D60"
  | "MASTERED";
export type AttemptResult = "FAIL" | "HARD" | "OK" | "EASY";

const INTERVALS: Record<SrsStage, number> = {
  NEW: 0,
  D1: 1,
  D3: 3,
  D7: 7,
  D14: 14,
  D30: 30,
  D60: 60,
  MASTERED: 180, // DECISION 4: 180 days, not 999
};

const STAGE_ORDER: SrsStage[] = [
  "NEW",
  "D1",
  "D3",
  "D7",
  "D14",
  "D30",
  "D60",
  "MASTERED",
];

@Injectable()
export class SrsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Schedule next review for a vocab item
   * Creates new vocab if doesn't exist, updates if exists
   */
  async scheduleNextReview(
    userId: string,
    contentId: string,
    word: string,
    context: string,
  ): Promise<any> {
    // Check if vocab already exists (case-insensitive)
    const existing = await this.prisma.user_vocabularies.findFirst({
      where: {
        user_id: userId,
        word: {
          equals: word,
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      // Update existing: calculate next review based on current stage
      const calc = this.calculateNextDue(existing.srs_stage as SrsStage, 'OK');
      
      return this.prisma.user_vocabularies.update({
        where: { id: existing.id },
        data: {
          due_at: calc.dueDate,
          srs_stage: calc.newStage,
          updated_at: new Date(),
        },
      });
    }

    // Create new vocab item
    return this.prisma.user_vocabularies.create({
      data: {
        id: uuidv4(),
        users: {
          connect: { id: userId },
        },
        contents: {
          connect: { id: contentId },
        },
        word,
        language: Language.EN, // Default language, should be derived from content
        srs_stage: 'NEW',
        due_at: addDays(new Date(), 1), // Review tomorrow
        mastery_score: 0,
        lapses_count: 0,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  /**
   * Calculate next SRS stage and due date based on attempt result
   * Deterministic algorithm - no AI, pure rules
   */
  calculateNextDue(
    currentStage: SrsStage,
    result: AttemptResult,
  ): {
    newStage: SrsStage;
    dueDate: Date;
    daysToAdd: number;
    lapseIncrement: number;
  } {
    // FAIL: Reset to D1
    if (result === "FAIL") {
      return {
        newStage: "D1",
        dueDate: addDays(new Date(), 1),
        daysToAdd: 1,
        lapseIncrement: 1,
      };
    }

    // HARD: Regress 1 stage
    if (result === "HARD") {
      const regressed = this.regressStage(currentStage, 1);
      const days = INTERVALS[regressed];
      return {
        newStage: regressed,
        dueDate: addDays(new Date(), days),
        daysToAdd: days,
        lapseIncrement: 0,
      };
    }

    // OK: Progress 1 stage
    if (result === "OK") {
      const next = this.progressStage(currentStage, 1);
      const days = INTERVALS[next];
      return {
        newStage: next,
        dueDate: addDays(new Date(), days),
        daysToAdd: days,
        lapseIncrement: 0,
      };
    }

    // EASY: Progress 2 stages
    if (result === "EASY") {
      const next = this.progressStage(currentStage, 2);
      const days = INTERVALS[next];
      return {
        newStage: next,
        dueDate: addDays(new Date(), days),
        daysToAdd: days,
        lapseIncrement: 0,
      };
    }

    // Fallback (should never reach)
    return {
      newStage: currentStage,
      dueDate: addDays(new Date(), INTERVALS[currentStage]),
      daysToAdd: INTERVALS[currentStage],
      lapseIncrement: 0,
    };
  }

  /**
   * Regress N stages (with floor at D1)
   */
  private regressStage(current: SrsStage, steps: number): SrsStage {
    const currentIndex = STAGE_ORDER.indexOf(current);
    const newIndex = Math.max(1, currentIndex - steps); // Floor at D1 (index 1)
    return STAGE_ORDER[newIndex];
  }

  /**
   * Progress N stages (with ceiling at MASTERED)
   */
  private progressStage(current: SrsStage, steps: number): SrsStage {
    const currentIndex = STAGE_ORDER.indexOf(current);
    const newIndex = Math.min(STAGE_ORDER.length - 1, currentIndex + steps);
    return STAGE_ORDER[newIndex];
  }

  /**
   * Get interval in days for a given stage
   */
  getStageInterval(stage: SrsStage): number {
    return INTERVALS[stage];
  }

  /**
   * Calculate mastery score (0-100) based on result
   */
  calculateMasteryDelta(result: AttemptResult): number {
    switch (result) {
      case "FAIL":
        return -20;
      case "HARD":
        return -5;
      case "OK":
        return +10;
      case "EASY":
        return +15;
      default:
        return 0;
    }
  }

  /**
   * Get due items for a user (for Learning Module integration)
   * Returns items that are due for review, ordered by urgency
   */
  async getDueItems(userId: string, limit: number = 5): Promise<any[]> {
    const now = new Date();

    const items = await this.prisma.user_vocabularies.findMany({
      where: {
        user_id: userId,
        due_at: {
          lte: now,
        },
      },
      orderBy: [
        { due_at: 'asc' }, // Most overdue first
        { lapses_count: 'desc' }, // Then by difficulty
      ],
      take: limit,
    });

    return items;
  }
}
