import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { GraphComparatorService } from '../comparator/graph-comparator.service';
import { TelemetryService } from '../../telemetry/telemetry.service';
import { GraphHealthService } from '../health/graph-health.service';
import { GraphMetricsService } from '../metrics/graph-metrics.service';

/**
 * GRAPH SCRIPT 19.9: Graph Comparison Cron Job
 * 
 * Runs daily at 2 AM to compare learner graphs with baselines.
 * Only processes graphs that have been updated since last comparison.
 */
@Injectable()
export class GraphComparisonJob {
  private readonly logger = new Logger(GraphComparisonJob.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly comparatorService: GraphComparatorService,
    private readonly telemetryService: TelemetryService,
    private readonly healthService: GraphHealthService,
    private readonly metricsService: GraphMetricsService,
  ) {}

  /**
   * Daily cron job to compare graphs
   * Runs at 2 AM (before decay job at 3 AM)
   */
  @Cron('0 2 * * *', {
    name: 'graph-comparison',
    timeZone: 'America/Sao_Paulo',
  })
  async handleDailyComparison() {
    const jobName = 'graph-comparison';
    const startTime = Date.now();
    
    this.healthService.recordJobStart(jobName);
    this.logger.log(`[${jobName}] Starting daily graph comparison job`);

    try {
      const graphs = await this.getActiveLearnerGraphs();
      this.logger.log(`[${jobName}] Found ${graphs.length} learner graphs to compare`);

      let successCount = 0;
      let errorCount = 0;

      for (const graph of graphs) {
        try {
          await this.comparatorService.compareGraphs(
            graph.scope_id,
            graph.content_id,
          );

          // Update last_compared_at timestamp
          await (this.prisma.topic_graphs as any).update({
            where: { id: graph.id },
            data: { last_compared_at: new Date() },
          });

          successCount++;
        } catch (error) {
          this.logger.error(
            `[${jobName}] Failed to compare graph ${graph.id}: ${error.message}`,
          );
          errorCount++;
        }
      }

      const duration = Date.now() - startTime;
      
      this.logger.log(
        `[${jobName}] Complete: ${successCount} success, ${errorCount} errors, ${duration}ms duration`,
      );

      // Record success in health service
      this.healthService.recordJobSuccess(jobName);
      
      // Record metrics for Prometheus/Grafana
      this.metricsService.recordJobExecution(jobName, duration, true, graphs.length);

      // Emit telemetry event
      await this.telemetryService.track({
        eventType: 'graph_comparison_completed' as any,
        eventVersion: '1.0.0',
        sessionId: `comparison-job-${Date.now()}`,
        contentId: 'system',
        data: {
          successCount,
          errorCount,
          totalGraphs: graphs.length,
          durationMs: duration,
          timestamp: new Date().toISOString(),
        },
      }, 'system');


    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logger.error(
        `[${jobName}] Job failed after ${duration}ms: ${error.message}`,
        error.stack,
      );
      
      // Record failure in health service
      this.healthService.recordJobFailure(jobName, error.message);
      
      // Record metrics for Prometheus/Grafana
      this.metricsService.recordJobExecution(jobName, duration, false);
      
      // Emit failure telemetry
      await this.telemetryService.track({
        eventType: 'graph_comparison_failed' as any,
        eventVersion: '1.0.0',
        sessionId: `comparison-job-${Date.now()}`,
        contentId: 'system',
        data: {
          error: error.message,
          durationMs: duration,
          timestamp: new Date().toISOString(),
        },
      }, 'system').catch(() => {}); // Ignore telemetry errors
      
      // Don't throw - let the job complete and retry next day
    }
  }

  /**
   * Get learner graphs that need comparison
   * 
   * Only returns graphs where:
   * - Type is LEARNER
   * - Never compared (last_compared_at is null) OR
   * - Updated since last comparison (updated_at > last_compared_at)
   * 
   * Limits to 100 graphs per run to avoid overload
   */
  private async getActiveLearnerGraphs() {
    // Use raw query for complex comparison
    const graphs = await this.prisma.$queryRaw<Array<{
      id: string;
      scope_id: string;
      content_id: string;
      updated_at: Date;
      last_compared_at: Date | null;
    }>>`
      SELECT id, scope_id, content_id, updated_at, last_compared_at
      FROM topic_graphs
      WHERE type = 'LEARNER'
        AND content_id IS NOT NULL
        AND (
          last_compared_at IS NULL
          OR updated_at > last_compared_at
        )
      ORDER BY updated_at ASC
      LIMIT 100
    `;

    return graphs;
  }
}
