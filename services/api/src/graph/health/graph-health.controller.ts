import { Controller, Get } from '@nestjs/common';
import { GraphHealthService, GraphHealthMetrics } from './graph-health.service';

/**
 * Graph Health Controller
 * 
 * Provides health check endpoints for monitoring Graph Automation.
 * Used by monitoring systems (Grafana, Prometheus, etc.)
 */
@Controller('health/graph-automation')
export class GraphHealthController {
  constructor(private readonly healthService: GraphHealthService) {}

  /**
   * Get comprehensive health metrics
   * 
   * GET /health/graph-automation
   */
  @Get()
  async getHealth(): Promise<GraphHealthMetrics> {
    return this.healthService.getHealthMetrics();
  }

  /**
   * Simple health check (returns 200 if system is operational)
   * 
   * GET /health/graph-automation/ping
   */
  @Get('ping')
  ping(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
