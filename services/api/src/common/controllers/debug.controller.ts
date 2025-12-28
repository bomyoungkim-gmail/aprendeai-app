import { Controller, Get } from '@nestjs/common';
import { Public } from '../../auth/decorators/public.decorator';
import { AuthMetricsInterceptor } from '../interceptors/auth-metrics.interceptor';

/**
 * Debug Controller
 * 
 * Provides debugging utilities for monitoring auth and system health
 */
@Controller('debug')
export class DebugController {
  constructor(private readonly authMetrics: AuthMetricsInterceptor) {}

  /**
   * Get authentication metrics
   * Public endpoint for monitoring
   */
  @Public()
  @Get('auth-metrics')
  getAuthMetrics() {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.authMetrics.getMetrics(),
    };
  }

  /**
   * Reset auth metrics (testing only)
   */
  @Public()
  @Get('reset-auth-metrics')
  resetAuthMetrics() {
    this.authMetrics.resetMetrics();
    return {
      message: 'Auth metrics reset successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
