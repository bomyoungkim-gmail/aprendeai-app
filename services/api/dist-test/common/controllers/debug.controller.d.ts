import { AuthMetricsInterceptor } from "../interceptors/auth-metrics.interceptor";
export declare class DebugController {
    private readonly authMetrics;
    constructor(authMetrics: AuthMetricsInterceptor);
    getAuthMetrics(): {
        timestamp: string;
        metrics: {
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
    };
    resetAuthMetrics(): {
        message: string;
        timestamp: string;
    };
}
