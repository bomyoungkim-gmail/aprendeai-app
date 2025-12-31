import { NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Observable } from "rxjs";
import { MetricsService } from "../../observability/metrics.service";
import { ErrorTrackingService } from "../../observability/error-tracking.service";
export declare class MetricsInterceptor implements NestInterceptor {
    private metricsService;
    private errorService;
    constructor(metricsService: MetricsService, errorService: ErrorTrackingService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
