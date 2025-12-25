import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { MetricsService } from "../../observability/metrics.service";
import { ErrorTrackingService } from "../../observability/error-tracking.service";

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(
    private metricsService: MetricsService,
    private errorService: ErrorTrackingService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const endpoint = request.route?.path || request.url;
    const method = request.method;
    const userId = request.user?.userId;

    return next.handle().pipe(
      tap({
        next: () => {
          // Success - record metrics
          const latency = Date.now() - startTime;
          const statusCode = response.statusCode;

          this.metricsService.recordRequest({
            endpoint,
            method,
            statusCode,
            latency,
            userId,
          });
        },
        error: (err) => {
          // Error - record metrics and log error
          const latency = Date.now() - startTime;
          const statusCode = err.status || 500;

          this.metricsService.recordRequest({
            endpoint,
            method,
            statusCode,
            latency,
            userId,
          });

          // Log error details
          this.errorService.logError({
            message: err.message,
            stack: err.stack,
            endpoint,
            method,
            statusCode,
            userId,
            requestId: request.id,
            metadata: {
              body: request.body,
              params: request.params,
              query: request.query,
            },
          });
        },
      }),
    );
  }
}
