import { Controller, Get, Header } from "@nestjs/common";
import { Public } from "../../auth/presentation/decorators/public.decorator";
import { GraphMetricsService } from "./graph-metrics.service";

/**
 * Graph Metrics Controller
 *
 * Exposes Prometheus-format metrics for scraping by monitoring systems.
 */
@Controller("metrics")
export class GraphMetricsController {
  constructor(private readonly metricsService: GraphMetricsService) {}

  /**
   * Prometheus metrics endpoint
   *
   * GET /metrics/graph
   */
  @Public()
  @Get("graph")
  @Header("Content-Type", "text/plain; version=0.0.4")
  async getMetrics(): Promise<string> {
    return this.metricsService.getPrometheusMetrics();
  }
}
