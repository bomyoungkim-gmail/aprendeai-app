"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AuthMetricsInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthMetricsInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
let AuthMetricsInterceptor = AuthMetricsInterceptor_1 = class AuthMetricsInterceptor {
    constructor() {
        this.logger = new common_1.Logger(AuthMetricsInterceptor_1.name);
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
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const startTime = Date.now();
        this.metrics.totalRequests++;
        const hasUser = !!request.user;
        if (hasUser) {
            this.metrics.protectedRouteHits++;
        }
        else {
            this.metrics.publicRouteHits++;
        }
        return next.handle().pipe((0, operators_1.tap)(() => {
            const latency = Date.now() - startTime;
            if (hasUser) {
                this.metrics.authSuccesses++;
                this.metrics.totalAuthLatencyMs += latency;
            }
            if (latency > 100 && hasUser) {
                this.logger.warn(`Slow auth detected: ${request.method} ${request.url} took ${latency}ms`);
            }
        }), (0, operators_1.catchError)((error) => {
            if (error.status === 401) {
                this.metrics.authFailures401++;
            }
            else if (error.status === 403) {
                this.metrics.authFailures403++;
            }
            throw error;
        }));
    }
    getMetrics() {
        const avgAuthLatency = this.metrics.authSuccesses > 0
            ? Math.round(this.metrics.totalAuthLatencyMs / this.metrics.authSuccesses)
            : 0;
        return Object.assign(Object.assign({}, this.metrics), { avgAuthLatencyMs: avgAuthLatency, authSuccessRate: this.metrics.protectedRouteHits > 0
                ? ((this.metrics.authSuccesses / this.metrics.protectedRouteHits) *
                    100).toFixed(2) + "%"
                : "N/A" });
    }
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
};
exports.AuthMetricsInterceptor = AuthMetricsInterceptor;
exports.AuthMetricsInterceptor = AuthMetricsInterceptor = AuthMetricsInterceptor_1 = __decorate([
    (0, common_1.Injectable)()
], AuthMetricsInterceptor);
//# sourceMappingURL=auth-metrics.interceptor.js.map