"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const admin_controller_1 = require("./admin.controller");
const dashboard_controller_1 = require("./dashboard.controller");
const config_controller_1 = require("./config.controller");
const admin_service_1 = require("./admin.service");
const prisma_module_1 = require("../prisma/prisma.module");
const encryption_service_1 = require("./services/encryption.service");
const secret_service_1 = require("./services/secret.service");
const config_service_1 = require("./services/config.service");
const ai_analytics_controller_1 = require("./ai-analytics.controller");
const admin_repository_interface_1 = require("./domain/admin.repository.interface");
const prisma_admin_repository_1 = require("./infrastructure/repositories/prisma-admin.repository");
const manage_feature_flags_use_case_1 = require("./application/use-cases/manage-feature-flags.use-case");
const get_platform_stats_use_case_1 = require("./application/use-cases/get-platform-stats.use-case");
const admin_user_management_use_case_1 = require("./application/use-cases/admin-user-management.use-case");
const llm_module_1 = require("../llm/llm.module");
const analytics_module_1 = require("../analytics/analytics.module");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            jwt_1.JwtModule.register({
                secret: process.env.JWT_SECRET || "your-secret-key",
                signOptions: { expiresIn: "60m" },
            }),
            llm_module_1.LLMModule,
            analytics_module_1.AnalyticsModule,
        ],
        controllers: [
            admin_controller_1.AdminController,
            dashboard_controller_1.DashboardController,
            config_controller_1.ConfigController,
            ai_analytics_controller_1.AiAnalyticsController,
        ],
        providers: [
            admin_service_1.AdminService,
            encryption_service_1.EncryptionService,
            secret_service_1.SecretService,
            config_service_1.ConfigService,
            manage_feature_flags_use_case_1.ManageFeatureFlagsUseCase,
            get_platform_stats_use_case_1.GetPlatformStatsUseCase,
            admin_user_management_use_case_1.AdminUserManagementUseCase,
            { provide: admin_repository_interface_1.IFeatureFlagsRepository, useClass: prisma_admin_repository_1.PrismaFeatureFlagsRepository },
            { provide: admin_repository_interface_1.IAuditLogsRepository, useClass: prisma_admin_repository_1.PrismaAuditLogsRepository },
        ],
        exports: [admin_service_1.AdminService, encryption_service_1.EncryptionService, secret_service_1.SecretService, config_service_1.ConfigService],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map