"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObservabilityModule = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_module_1 = require("../prisma/prisma.module");
const metrics_service_1 = require("./metrics.service");
const error_tracking_service_1 = require("./error-tracking.service");
const provider_usage_service_1 = require("./provider-usage.service");
const jobs_service_1 = require("./jobs.service");
let ObservabilityModule = class ObservabilityModule {
};
exports.ObservabilityModule = ObservabilityModule;
exports.ObservabilityModule = ObservabilityModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            schedule_1.ScheduleModule.forRoot(),
        ],
        providers: [
            metrics_service_1.MetricsService,
            error_tracking_service_1.ErrorTrackingService,
            provider_usage_service_1.ProviderUsageService,
            jobs_service_1.ObservabilityJobsService,
        ],
        exports: [metrics_service_1.MetricsService, error_tracking_service_1.ErrorTrackingService, provider_usage_service_1.ProviderUsageService],
    })
], ObservabilityModule);
//# sourceMappingURL=observability.module.js.map