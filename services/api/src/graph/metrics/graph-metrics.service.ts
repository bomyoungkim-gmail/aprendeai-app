import { Injectable } from '@nestjs/common';
import { GraphHealthService } from '../health/graph-health.service';

/**
 * Graph Metrics Service
 * 
 * Collects and exposes metrics in Prometheus format for Grafana.
 * Custom implementation without external dependencies.
 */
@Injectable()
export class GraphMetricsService {
  // Metric storage
  private jobDurations = new Map<string, number[]>();
  private jobSuccessCount = new Map<string, number>();
  private jobFailureCount = new Map<string, number>();
  private graphsProcessed = new Map<string, number>();

  constructor(private readonly healthService: GraphHealthService) {}

  /**
   * Record job execution metrics
   */
  recordJobExecution(jobName: string, durationMs: number, success: boolean, graphsProcessed?: number): void {
    // Track duration
    if (!this.jobDurations.has(jobName)) {
      this.jobDurations.set(jobName, []);
    }
    this.jobDurations.get(jobName)!.push(durationMs);
    
    // Keep only last 100 durations for percentile calculation
    const durations = this.jobDurations.get(jobName)!;
    if (durations.length > 100) {
      durations.shift();
    }

    // Track success/failure
    if (success) {
      this.jobSuccessCount.set(jobName, (this.jobSuccessCount.get(jobName) || 0) + 1);
    } else {
      this.jobFailureCount.set(jobName, (this.jobFailureCount.get(jobName) || 0) + 1);
    }

    // Track graphs processed
    if (graphsProcessed !== undefined) {
      this.graphsProcessed.set(jobName, graphsProcessed);
    }
  }

  /**
   * Calculate percentile from array of numbers
   */
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Export metrics in Prometheus format
   * 
   * TODO: AC1: Production Monitoring - Configure alerts to trigger on job failures within 15 minutes
   * (This should be done in Prometheus/Grafana alert rules using graph_job_health or graph_job_executions_total)
   * 
   * TODO: Grafana Dashboard Review
   * - Tune alert thresholds (based on real production data)
   * - Add ML-specific panels (if Phase 3 implemented)
   */
  async getPrometheusMetrics(): Promise<string> {
    const metrics: string[] = [];
    const timestamp = Date.now();

    // Job duration metrics (histogram approximation)
    metrics.push('# HELP graph_job_duration_ms Job execution duration in milliseconds');
    metrics.push('# TYPE graph_job_duration_ms summary');
    
    for (const [jobName, durations] of this.jobDurations.entries()) {
      if (durations.length > 0) {
        const p50 = this.calculatePercentile(durations, 50);
        const p95 = this.calculatePercentile(durations, 95);
        const p99 = this.calculatePercentile(durations, 99);
        
        metrics.push(`graph_job_duration_ms{job="${jobName}",quantile="0.5"} ${p50}`);
        metrics.push(`graph_job_duration_ms{job="${jobName}",quantile="0.95"} ${p95}`);
        metrics.push(`graph_job_duration_ms{job="${jobName}",quantile="0.99"} ${p99}`);
      }
    }

    // Job success/failure counters
    metrics.push('# HELP graph_job_executions_total Total number of job executions');
    metrics.push('# TYPE graph_job_executions_total counter');
    
    for (const [jobName, count] of this.jobSuccessCount.entries()) {
      metrics.push(`graph_job_executions_total{job="${jobName}",status="success"} ${count}`);
    }
    
    for (const [jobName, count] of this.jobFailureCount.entries()) {
      metrics.push(`graph_job_executions_total{job="${jobName}",status="failure"} ${count}`);
    }

    // Graphs processed gauge
    metrics.push('# HELP graph_job_graphs_processed Number of graphs processed in last run');
    metrics.push('# TYPE graph_job_graphs_processed gauge');
    
    for (const [jobName, count] of this.graphsProcessed.entries()) {
      metrics.push(`graph_job_graphs_processed{job="${jobName}"} ${count}`);
    }

    // Get health metrics from health service
    try {
      const healthMetrics = await this.healthService.getHealthMetrics();
      
      // Total learner graphs
      metrics.push('# HELP graph_total_learner_graphs Total number of learner graphs');
      metrics.push('# TYPE graph_total_learner_graphs gauge');
      metrics.push(`graph_total_learner_graphs ${healthMetrics.totalLearnerGraphs}`);
      
      // Average confidence
      metrics.push('# HELP graph_average_confidence Average confidence score across all nodes');
      metrics.push('# TYPE graph_average_confidence gauge');
      metrics.push(`graph_average_confidence ${healthMetrics.averageConfidence}`);
      
      // Graphs needing comparison
      metrics.push('# HELP graph_needing_comparison Number of graphs needing comparison');
      metrics.push('# TYPE graph_needing_comparison gauge');
      metrics.push(`graph_needing_comparison ${healthMetrics.graphsNeedingComparison}`);
      
      // Job health status (0=error, 1=warning, 2=healthy)
      metrics.push('# HELP graph_job_health Job health status (0=error, 1=warning, 2=healthy)');
      metrics.push('# TYPE graph_job_health gauge');
      
      const comparisonHealth = this.healthStatusToNumber(healthMetrics.lastComparisonJob.status);
      const decayHealth = this.healthStatusToNumber(healthMetrics.lastDecayJob.status);
      
      metrics.push(`graph_job_health{job="graph-comparison"} ${comparisonHealth}`);
      metrics.push(`graph_job_health{job="graph-decay"} ${decayHealth}`);
    } catch (error) {
      // If health metrics fail, continue with what we have
    }

    return metrics.join('\n') + '\n';
  }

  /**
   * Convert health status to numeric value
   */
  private healthStatusToNumber(status: string): number {
    switch (status) {
      case 'healthy': return 2;
      case 'warning': return 1;
      case 'error': return 0;
      default: return 0;
    }
  }
}
