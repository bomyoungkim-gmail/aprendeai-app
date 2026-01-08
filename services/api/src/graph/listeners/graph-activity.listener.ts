import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule'; // GRAPH SCRIPT 19.9: Cleanup job
import { GraphComparatorService } from '../comparator/graph-comparator.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ThresholdOptimizerService } from '../adaptive/threshold-optimizer.service';

/**
 * GRAPH SCRIPT 19.9: Graph Activity Listener
 * 
 * Triggers on-demand graph comparison after significant learner graph updates.
 * Implements threshold-based triggering to avoid excessive comparisons.
 */
@Injectable()
export class GraphActivityListener {
  private readonly logger = new Logger(GraphActivityListener.name);

  // Track activity count per graph (userId:contentId -> count)
  private activityCounter = new Map<string, number>();

  // Default threshold (can be overridden per user by ThresholdOptimizerService)
  private readonly DEFAULT_ACTIVITY_THRESHOLD = parseInt(
    process.env.GRAPH_COMPARISON_ACTIVITY_THRESHOLD || '5',
    10,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly comparatorService: GraphComparatorService,
    private readonly thresholdOptimizer: ThresholdOptimizerService,
  ) {}

  /**
   * Listen to graph learner updates
   * Emitted by GraphLearnerService after processing events
   */
  @OnEvent('graph.learner.updated')
  async handleGraphUpdate(payload: { userId: string; contentId: string }) {
    const key = `${payload.userId}:${payload.contentId}`;

    try {
      // Get user-specific threshold (adaptive)
      const threshold = await this.thresholdOptimizer.getThreshold(payload.userId);
      
      // Increment activity counter
      const currentCount = this.activityCounter.get(key) || 0;
      const newCount = currentCount + 1;
      this.activityCounter.set(key, newCount);

      this.logger.debug(
        `Graph activity: ${key} - ${newCount}/${threshold} (adaptive)`,
      );

      // Trigger comparison if threshold reached
      if (newCount >= threshold) {
        this.logger.log(
          `Activity threshold reached for ${key}, triggering on-demand comparison`,
        );

        const comparisonResult = await this.comparatorService.compareGraphs(
          payload.userId,
          payload.contentId,
        );

        // Calculate total changes from diff
        const diff = comparisonResult.diff_json;
        const totalChanges =
          diff.nodes.missingInLearner +
          diff.nodes.extraInLearner +
          diff.edges.baselineOnly +
          diff.edges.learnerOnly;
        const hadChanges = totalChanges > 0;
        await this.thresholdOptimizer.recordComparisonOutcome(
          payload.userId,
          hadChanges,
        );

        // Update last_compared_at
        const graph = await this.prisma.topic_graphs.findFirst({
          where: {
            type: 'LEARNER',
            scope_id: payload.userId,
            content_id: payload.contentId,
          },
        });

        if (graph) {
          await (this.prisma.topic_graphs as any).update({
            where: { id: graph.id },
            data: { last_compared_at: new Date() },
          });
        }

        // Reset counter
        this.activityCounter.delete(key);

        this.logger.log(
          `On-demand comparison complete for ${key} (changes: ${hadChanges ? 'yes' : 'no'})`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle graph activity for ${key}: ${error.message}`,
        error.stack,
      );
      // Don't throw - this is a best-effort operation
    }
  }

  /**
   * Periodic cleanup of stale counters
   * Prevents memory leak from abandoned graphs
   * Runs daily at 4 AM (after comparison and decay jobs)
   */
  @Cron('0 4 * * *', {
    name: 'graph-activity-cleanup',
    timeZone: 'America/Sao_Paulo',
  })
  async handleDailyCleanup() {
    const sizeBefore = this.activityCounter.size;
    
    // Clear all counters (they reset after comparison anyway)
    this.activityCounter.clear();
    
    this.logger.log(
      `Activity counter cleanup complete: ${sizeBefore} entries removed`,
    );
  }
}
