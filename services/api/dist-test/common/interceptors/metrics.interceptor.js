"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const metrics_service_1 = require("../../observability/metrics.service");
const error_tracking_service_1 = require("../../observability/error-tracking.service");
let MetricsInterceptor = class MetricsInterceptor {
    constructor(metricsService, errorService) {
        this.metricsService = metricsService;
        this.errorService = errorService;
    }
    intercept(context, next) {
        var _a, _b;
        const startTime = Date.now();
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const endpoint = ((_a = request.route) === null || _a === void 0 ? void 0 : _a.path) || request.url;
        const method = request.method;
        const userId = (_b = request.user) === null || _b === void 0 ? void 0 : _b.userId;
        return next.handle().pipe((0, operators_1.tap)({
            next: () => {
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
                const latency = Date.now() - startTime;
                const statusCode = err.status || 500;
                this.metricsService.recordRequest({
                    endpoint,
                    method,
                    statusCode,
                    latency,
                    userId,
                });
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
        }));
    }
};
exports.MetricsInterceptor = MetricsInterceptor;
exports.MetricsInterceptor = MetricsInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [metrics_service_1.MetricsService,
        error_tracking_service_1.ErrorTrackingService])
], MetricsInterceptor);
//# sourceMappingURL=metrics.interceptor.js.map