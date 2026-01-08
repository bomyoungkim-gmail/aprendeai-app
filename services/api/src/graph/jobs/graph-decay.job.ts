import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GraphDecayService } from '../decay/graph-decay.service';
import { TelemetryService } from '../../telemetry/telemetry.service';
import { TelemetryEventType } from '../../telemetry/domain/telemetry.constants';
import { GraphHealthService } from '../health/graph-health.service';
import { GraphMetricsService } from '../metrics/graph-metrics.service';

/**
 * GRAPH SCRIPT 19.10: Temporal Decay Cron Job
 * 
 * Runs daily at 3 AM to apply temporal decay to all learner graph nodes.
 * This represents the natural forgetting curve - nodes that haven't been
 * reinforced (via highlights, missions, reviews) will gradually lose confidence.
 */
@Injectable()
export class GraphDecayJob {
  private readonly logger = new Logger(GraphDecayJob.name);

  constructor(
    private readonly decayService: GraphDecayService,
    private readonly telemetryService: TelemetryService,
    private readonly healthService: GraphHealthService,
    private readonly metricsService: GraphMetricsService,
  ) {}

  /**
   * Daily cron job to apply temporal decay
   * Runs at 3 AM (after comparison job at 2 AM)
   */
  @Cron('0 3 * * *', {
    name: 'graph-decay',
    timeZone: 'America/Sao_Paulo',
  })
  async handleDailyDecay() {
    const jobName = 'graph-decay';
    const startTime = Date.now();
    
    this.healthService.recordJobStart(jobName);
    this.logger.log(`[${jobName}] Starting daily graph decay job`);

    try {
      const nodesUpdated = await this.decayService.applyBulkDecay();
      const duration = Date.now() - startTime;

      this.logger.log(
        `[${jobName}] Complete: ${nodesUpdated} nodes decayed, ${duration}ms duration`,
      );
      
      // Record success
      this.healthService.recordJobSuccess(jobName);
      
      // Record metrics for Prometheus/Grafana
      this.metricsService.recordJobExecution(jobName, duration, true, nodesUpdated);

      // Emit telemetry event
      await this.telemetryService.track({
        eventType: 'graph_decay_completed' as any,
        eventVersion: '1.0.0',
        sessionId: `decay-job-${Date.now()}`,
        contentId: 'system',
        data: {
          nodesUpdated,
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
      
      // Record failure
      this.healthService.recordJobFailure(jobName, error.message);
      
      // Record metrics for Prometheus/Grafana
      this.metricsService.recordJobExecution(jobName, duration, false);

      // Emit failure telemetry
      await this.telemetryService.track({
        eventType: 'graph_decay_failed' as any,
        eventVersion: '1.0.0',
        sessionId: `decay-job-${Date.now()}`,
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
}
