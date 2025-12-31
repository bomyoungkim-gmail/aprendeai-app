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
exports.DebugController = void 0;
const common_1 = require("@nestjs/common");
const public_decorator_1 = require("../../auth/presentation/decorators/public.decorator");
const auth_metrics_interceptor_1 = require("../interceptors/auth-metrics.interceptor");
let DebugController = class DebugController {
    constructor(authMetrics) {
        this.authMetrics = authMetrics;
    }
    getAuthMetrics() {
        return {
            timestamp: new Date().toISOString(),
            metrics: this.authMetrics.getMetrics(),
        };
    }
    resetAuthMetrics() {
        this.authMetrics.resetMetrics();
        return {
            message: "Auth metrics reset successfully",
            timestamp: new Date().toISOString(),
        };
    }
};
exports.DebugController = DebugController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)("auth-metrics"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DebugController.prototype, "getAuthMetrics", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)("reset-auth-metrics"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DebugController.prototype, "resetAuthMetrics", null);
exports.DebugController = DebugController = __decorate([
    (0, common_1.Controller)("debug"),
    __metadata("design:paramtypes", [auth_metrics_interceptor_1.AuthMetricsInterceptor])
], DebugController);
//# sourceMappingURL=debug.controller.js.map