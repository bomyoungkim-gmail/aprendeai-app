import { NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Observable } from "rxjs";
export declare class AuthMetricsInterceptor implements NestInterceptor {
    private readonly logger;
    private metrics;
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    getMetrics(): {
        avgAuthLatencyMs: number;
        authSuccessRate: string;
        totalRequests: number;
        publicRouteHits: number;
        protectedRouteHits: number;
        authSuccesses: number;
        authFailures401: number;
        authFailures403: number;
        totalAuthLatencyMs: number;
    };
    resetMetrics(): void;
}
