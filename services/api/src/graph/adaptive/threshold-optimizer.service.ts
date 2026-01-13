import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

/**
 * Threshold Optimizer Service
 *
 * Dynamically adjusts the activity threshold for graph comparisons
 * based on comparison effectiveness (% of comparisons with actual changes).
 *
 * TODO: AC2: Adaptive Thresholds - Verify 20% reduction in unnecessary comparisons
 */
@Injectable()
export class ThresholdOptimizerService {
  private readonly logger = new Logger(ThresholdOptimizerService.name);

  // Configuration
  private readonly MIN_THRESHOLD = 3;
  private readonly MAX_THRESHOLD = 10;
  private readonly DEFAULT_THRESHOLD = 5;

  // Thresholds for adjustment
  private readonly LOW_CHANGE_RATE = 0.3; // < 30% of comparisons had changes
  private readonly HIGH_CHANGE_RATE = 0.7; // > 70% of comparisons had changes

  // Damping: only adjust after N comparisons
  private readonly MIN_COMPARISONS_FOR_ADJUSTMENT = 10;

  // In-memory threshold storage (TODO: persist to DB)
  private thresholds = new Map<string, number>();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record the outcome of a comparison
   *
   * @param userId - User ID
   * @param hadChanges - Whether the comparison detected changes
   */
  async recordComparisonOutcome(
    userId: string,
    hadChanges: boolean,
  ): Promise<void> {
    try {
      // Store outcome in a tracking table (we'll create this)
      await this.prisma.graph_comparison_outcomes.create({
        data: {
          user_id: userId,
          had_changes: hadChanges,
          recorded_at: new Date(),
        },
      });

      // Check if we should recalculate threshold
      await this.maybeRecalculateThreshold(userId);
    } catch (error) {
      this.logger.error(
        `Failed to record comparison outcome: ${error.message}`,
      );
      // Don't throw - this is best-effort optimization
    }
  }

  /**
   * Get the current threshold for a user
   *
   * @param userId - User ID
   * @returns Activity threshold (3-10)
   */
  async getThreshold(userId: string): Promise<number> {
    // For now, use in-memory storage
    // TODO: Persist to database when user_preferences table is available
    return this.thresholds.get(userId) || this.DEFAULT_THRESHOLD;
  }

  /**
   * Recalculate threshold if enough data is available
   */
  private async maybeRecalculateThreshold(userId: string): Promise<void> {
    // Get recent comparison outcomes (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const outcomes = await this.prisma.graph_comparison_outcomes.findMany({
      where: {
        user_id: userId,
        recorded_at: { gte: thirtyDaysAgo },
      },
      orderBy: { recorded_at: "desc" },
      take: 50, // Consider last 50 comparisons
    });

    // Need minimum data points
    if (outcomes.length < this.MIN_COMPARISONS_FOR_ADJUSTMENT) {
      return;
    }

    // Calculate change rate
    const changesDetected = outcomes.filter((o) => o.had_changes).length;
    const changeRate = changesDetected / outcomes.length;

    this.logger.debug(
      `User ${userId}: ${changesDetected}/${outcomes.length} comparisons had changes (${(changeRate * 100).toFixed(1)}%)`,
    );

    // Get current threshold
    const currentThreshold = await this.getThreshold(userId);
    let newThreshold = currentThreshold;

    // Adjust threshold based on change rate
    if (changeRate < this.LOW_CHANGE_RATE) {
      // Too many comparisons with no changes → increase threshold
      newThreshold = Math.min(currentThreshold + 1, this.MAX_THRESHOLD);
      this.logger.log(
        `User ${userId}: Low change rate (${(changeRate * 100).toFixed(1)}%), increasing threshold ${currentThreshold} → ${newThreshold}`,
      );
    } else if (changeRate > this.HIGH_CHANGE_RATE) {
      // Most comparisons have changes → decrease threshold
      newThreshold = Math.max(currentThreshold - 1, this.MIN_THRESHOLD);
      this.logger.log(
        `User ${userId}: High change rate (${(changeRate * 100).toFixed(1)}%), decreasing threshold ${currentThreshold} → ${newThreshold}`,
      );
    }

    // Update if changed
    if (newThreshold !== currentThreshold) {
      await this.updateThreshold(userId, newThreshold);
    }
  }

  /**
   * Update user's threshold in memory
   * TODO: Persist to database when user_preferences table is available
   */
  private async updateThreshold(
    userId: string,
    threshold: number,
  ): Promise<void> {
    this.thresholds.set(userId, threshold);
  }

  /**
   * Get statistics for monitoring
   */
  async getStatistics(userId: string): Promise<{
    currentThreshold: number;
    recentComparisons: number;
    changeRate: number;
  }> {
    const threshold = await this.getThreshold(userId);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const outcomes = await this.prisma.graph_comparison_outcomes.findMany({
      where: {
        user_id: userId,
        recorded_at: { gte: thirtyDaysAgo },
      },
    });

    const changesDetected = outcomes.filter((o) => o.had_changes).length;
    const changeRate =
      outcomes.length > 0 ? changesDetected / outcomes.length : 0;

    return {
      currentThreshold: threshold,
      recentComparisons: outcomes.length,
      changeRate,
    };
  }
}
