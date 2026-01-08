import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface JobStatus {
  name: string;
  lastRun: Date | null;
  lastSuccess: Date | null;
  lastFailure: Date | null;
  status: 'healthy' | 'warning' | 'error';
  message: string;
}

export interface GraphHealthMetrics {
  totalLearnerGraphs: number;
  averageConfidence: number;
  graphsNeedingComparison: number;
  lastComparisonJob: JobStatus;
  lastDecayJob: JobStatus;
}

/**
 * Graph Health Service
 * 
 * Tracks the health and status of Graph Automation jobs.
 * Provides metrics for monitoring and alerting.
 */
@Injectable()
export class GraphHealthService {
  private readonly logger = new Logger(GraphHealthService.name);
  
  // In-memory tracking of job executions
  private jobExecutions = new Map<string, {
    lastRun: Date;
    lastSuccess: Date | null;
    lastFailure: Date | null;
    lastError: string | null;
  }>();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record a job execution start
   */
  recordJobStart(jobName: string): void {
    const existing = this.jobExecutions.get(jobName) || {
      lastRun: new Date(),
      lastSuccess: null,
      lastFailure: null,
      lastError: null,
    };
    
    existing.lastRun = new Date();
    this.jobExecutions.set(jobName, existing);
  }

  /**
   * Record a job execution success
   */
  recordJobSuccess(jobName: string): void {
    const existing = this.jobExecutions.get(jobName);
    if (existing) {
      existing.lastSuccess = new Date();
      existing.lastError = null;
    }
  }

  /**
   * Record a job execution failure
   */
  recordJobFailure(jobName: string, error: string): void {
    const existing = this.jobExecutions.get(jobName);
    if (existing) {
      existing.lastFailure = new Date();
      existing.lastError = error;
    }
  }

  /**
   * Get status for a specific job
   */
  getJobStatus(jobName: string): JobStatus {
    const execution = this.jobExecutions.get(jobName);
    
    if (!execution) {
      return {
        name: jobName,
        lastRun: null,
        lastSuccess: null,
        lastFailure: null,
        status: 'warning',
        message: 'Job has never run',
      };
    }

    const now = new Date();
    const hoursSinceLastRun = execution.lastRun 
      ? (now.getTime() - execution.lastRun.getTime()) / (1000 * 60 * 60)
      : Infinity;

    // If last run was a failure
    if (execution.lastFailure && (!execution.lastSuccess || execution.lastFailure > execution.lastSuccess)) {
      return {
        name: jobName,
        lastRun: execution.lastRun,
        lastSuccess: execution.lastSuccess,
        lastFailure: execution.lastFailure,
        status: 'error',
        message: `Last execution failed: ${execution.lastError || 'Unknown error'}`,
      };
    }

    // If job hasn't run in >25 hours (should run daily)
    if (hoursSinceLastRun > 25) {
      return {
        name: jobName,
        lastRun: execution.lastRun,
        lastSuccess: execution.lastSuccess,
        lastFailure: execution.lastFailure,
        status: 'warning',
        message: `Job hasn't run in ${Math.floor(hoursSinceLastRun)} hours`,
      };
    }

    return {
      name: jobName,
      lastRun: execution.lastRun,
      lastSuccess: execution.lastSuccess,
      lastFailure: execution.lastFailure,
      status: 'healthy',
      message: 'Job running normally',
    };
  }

  /**
   * Get comprehensive health metrics
   */
  async getHealthMetrics(): Promise<GraphHealthMetrics> {
    // Get total learner graphs
    const totalLearnerGraphs = await this.prisma.topic_graphs.count({
      where: { type: 'LEARNER' },
    });

    // Calculate average confidence
    const avgResult = await this.prisma.$queryRaw<Array<{ avg: number }>>`
      SELECT AVG(confidence) as avg
      FROM topic_nodes
      WHERE graph_id IN (
        SELECT id FROM topic_graphs WHERE type = 'LEARNER'
      )
    `;
    const averageConfidence = avgResult[0]?.avg || 0;

    // Get graphs needing comparison
    const graphsNeedingComparison = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM topic_graphs
      WHERE type = 'LEARNER'
        AND content_id IS NOT NULL
        AND (
          last_compared_at IS NULL
          OR updated_at > last_compared_at
        )
    `;
    const needingComparison = Number(graphsNeedingComparison[0]?.count || 0);

    return {
      totalLearnerGraphs,
      averageConfidence: Number(averageConfidence.toFixed(3)),
      graphsNeedingComparison: needingComparison,
      lastComparisonJob: this.getJobStatus('graph-comparison'),
      lastDecayJob: this.getJobStatus('graph-decay'),
    };
  }
}
