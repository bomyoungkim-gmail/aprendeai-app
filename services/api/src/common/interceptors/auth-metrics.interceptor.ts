import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap, catchError } from "rxjs/operators";

/**
 * Auth Metrics Interceptor
 *
 * Tracks authentication-related metrics for monitoring and debugging:
 * - Total auth attempts
 * - Successful authentications
 * - Failed authentications (401/403)
 * - Auth latency
 */
@Injectable()
export class AuthMetricsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuthMetricsInterceptor.name);

  // In-memory counters (in production, use Redis or metrics service)
  private metrics = {
    totalRequests: 0,
    publicRouteHits: 0,
    protectedRouteHits: 0,
    authSuccesses: 0,
    authFailures401: 0,
    authFailures403: 0,
    totalAuthLatencyMs: 0,
  };

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();

    this.metrics.totalRequests++;

    // Check if route is public (has user)
    const hasUser = !!request.user;
    if (hasUser) {
      this.metrics.protectedRouteHits++;
    } else {
      this.metrics.publicRouteHits++;
    }

    return next.handle().pipe(
      tap(() => {
        const latency = Date.now() - startTime;

        if (hasUser) {
          this.metrics.authSuccesses++;
          this.metrics.totalAuthLatencyMs += latency;
        }

        // Log slow auth (> 100ms)
        if (latency > 100 && hasUser) {
          this.logger.warn(
            `Slow auth detected: ${request.method} ${request.url} took ${latency}ms`,
          );
        }
      }),
      catchError((error) => {
        // Track auth failures
        if (error.status === 401) {
          this.metrics.authFailures401++;
        } else if (error.status === 403) {
          this.metrics.authFailures403++;
        }

        throw error;
      }),
    );
  }

  /**
   * Get current auth metrics
   */
  getMetrics() {
    const avgAuthLatency =
      this.metrics.authSuccesses > 0
        ? Math.round(
            this.metrics.totalAuthLatencyMs / this.metrics.authSuccesses,
          )
        : 0;

    return {
      ...this.metrics,
      avgAuthLatencyMs: avgAuthLatency,
      authSuccessRate:
        this.metrics.protectedRouteHits > 0
          ? (
              (this.metrics.authSuccesses / this.metrics.protectedRouteHits) *
              100
            ).toFixed(2) + "%"
          : "N/A",
    };
  }

  /**
   * Reset metrics (useful for testing)
   */
  resetMetrics() {
    this.metrics = {
      totalRequests: 0,
      publicRouteHits: 0,
      protectedRouteHits: 0,
      authSuccesses: 0,
      authFailures401: 0,
      authFailures403: 0,
      totalAuthLatencyMs: 0,
    };
  }
}
