import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

interface UserActivityFeatures {
  activityFrequency: number; // Activities per day
  avgSessionDuration: number; // Minutes
  retentionRate: number; // % of nodes retained after 30 days
  rehighlightRate: number; // % of highlights revisited
}

/**
 * Decay Predictor Service
 *
 * Uses simple ML (linear regression) to predict optimal decay half-life per user.
 * Based on user activity patterns and historical retention.
 */
@Injectable()
export class DecayPredictorService {
  private readonly logger = new Logger(DecayPredictorService.name);

  // Model coefficients (trained offline)
  // These would be updated by a training pipeline
  // TODO: Model training pipeline (future work)
  // TODO: Offline training script
  // TODO: Validation on holdout set
  // TODO: AC4: ML Personalization
  // - Verify model predicts half-life with <20% error
  // - Verify personalized decay applied to 10% of users
  // - Track 15% improvement in retention metrics
  private readonly MODEL_COEFFICIENTS = {
    intercept: 5.0, // Base half-life in days (reduced to allow strictly positive features to scale from 7 up to 30)
    activityFrequency: 2.5, // More active → longer half-life
    avgSessionDuration: 0.3,
    retentionRate: 8.0, // Better retention → longer half-life
    rehighlightRate: 5.0,
  };

  // Bounds for half-life
  private readonly MIN_HALF_LIFE = 7; // days
  private readonly MAX_HALF_LIFE = 30; // days
  private readonly DEFAULT_HALF_LIFE = 14; // days

  // Cache predictions (in-memory for now)
  private predictions = new Map<string, number>();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get predicted half-life for a user
   *
   * @param userId - User ID
   * @returns Predicted half-life in days
   */
  async getPredictedHalfLife(userId: string): Promise<number> {
    // Check cache
    if (this.predictions.has(userId)) {
      return this.predictions.get(userId)!;
    }

    try {
      // Extract features
      const features = await this.extractFeatures(userId);

      // Predict using linear regression
      const prediction = this.predict(features);

      // Cache result
      this.predictions.set(userId, prediction);

      this.logger.debug(
        `Predicted half-life for user ${userId}: ${prediction.toFixed(1)} days (features: ${JSON.stringify(features)})`,
      );

      return prediction;
    } catch (error) {
      this.logger.error(
        `Failed to predict half-life for user ${userId}: ${error.message}`,
      );
      return this.DEFAULT_HALF_LIFE;
    }
  }

  /**
   * Extract features for prediction
   */
  private async extractFeatures(userId: string): Promise<UserActivityFeatures> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Activity frequency (highlights per day)
    const highlightCount = await this.prisma.highlights.count({
      where: {
        user_id: userId,
        created_at: { gte: thirtyDaysAgo },
      },
    });
    const activityFrequency = highlightCount / 30;

    // Average session duration (simplified - based on reading sessions)
    const sessions = await this.prisma.reading_sessions.findMany({
      where: {
        user_id: userId,
        started_at: { gte: thirtyDaysAgo },
      },
      select: { started_at: true, finished_at: true },
    });
    const avgSessionDuration =
      sessions.length > 0
        ? sessions.reduce((sum, s) => {
            const duration =
              s.finished_at && s.started_at
                ? (s.finished_at.getTime() - s.started_at.getTime()) /
                  (1000 * 60) // minutes
                : 0;
            return sum + duration;
          }, 0) / sessions.length
        : 0;

    // Retention rate (% of nodes still above threshold after 30 days)
    const oldNodes = await this.prisma.$queryRaw<
      Array<{ total: bigint; retained: bigint }>
    >`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE confidence >= 0.5) as retained
      FROM topic_nodes tn
      JOIN topic_graphs tg ON tn.graph_id = tg.id
      WHERE tg.scope_id = ${userId}
        AND tg.type = 'LEARNER'
        AND tn.created_at <= ${thirtyDaysAgo}
    `;
    const total = Number(oldNodes[0]?.total || 0);
    const retained = Number(oldNodes[0]?.retained || 0);
    const retentionRate = total > 0 ? retained / total : 0.5;

    // Rehighlight rate (% of highlights that were revisited)
    // Simplified: assume highlights with multiple annotations indicate revisits
    const totalHighlights = await this.prisma.highlights.count({
      where: { user_id: userId },
    });
    const revisitedHighlights = await this.prisma.highlights.count({
      where: {
        user_id: userId,
        annotation_comments: { some: {} },
      },
    });
    const rehighlightRate =
      totalHighlights > 0 ? revisitedHighlights / totalHighlights : 0;

    return {
      activityFrequency,
      avgSessionDuration,
      retentionRate,
      rehighlightRate,
    };
  }

  /**
   * Predict half-life using linear regression
   */
  private predict(features: UserActivityFeatures): number {
    const {
      intercept,
      activityFrequency,
      avgSessionDuration,
      retentionRate,
      rehighlightRate,
    } = this.MODEL_COEFFICIENTS;

    const prediction =
      intercept +
      activityFrequency * features.activityFrequency +
      avgSessionDuration * features.avgSessionDuration +
      retentionRate * features.retentionRate +
      rehighlightRate * features.rehighlightRate;

    // Clamp to bounds
    const result = Math.max(
      this.MIN_HALF_LIFE,
      Math.min(this.MAX_HALF_LIFE, prediction),
    );
    console.log(
      `[DEBUG] Prediction: raw=${prediction}, clamped=${result}, features=`,
      features,
    );
    return result;
  }

  /**
   * Clear cache for a user (call when retraining)
   */
  clearCache(userId?: string): void {
    if (userId) {
      this.predictions.delete(userId);
    } else {
      this.predictions.clear();
    }
  }

  /**
   * Get statistics for monitoring
   */
  async getStatistics(userId: string): Promise<{
    predictedHalfLife: number;
    features: UserActivityFeatures;
    usingDefault: boolean;
  }> {
    try {
      const features = await this.extractFeatures(userId);
      const predictedHalfLife = this.predict(features);

      return {
        predictedHalfLife,
        features,
        usingDefault: false,
      };
    } catch (error) {
      return {
        predictedHalfLife: this.DEFAULT_HALF_LIFE,
        features: {
          activityFrequency: 0,
          avgSessionDuration: 0,
          retentionRate: 0,
          rehighlightRate: 0,
        },
        usingDefault: true,
      };
    }
  }
}
