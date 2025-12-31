import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AdminController } from "./admin.controller";
import { DashboardController } from "./dashboard.controller";
import { ConfigController } from "./config.controller";
import { AdminService } from "./admin.service";
import { PrismaModule } from "../prisma/prisma.module";
import { EncryptionService } from "./services/encryption.service";
import { SecretService } from "./services/secret.service";
import { ConfigService } from "./services/config.service";
import { AiAnalyticsController } from "./ai-analytics.controller";
import { IFeatureFlagsRepository, IAuditLogsRepository } from "./domain/admin.repository.interface";
import { PrismaFeatureFlagsRepository, PrismaAuditLogsRepository } from "./infrastructure/repositories/prisma-admin.repository";
import { ManageFeatureFlagsUseCase } from "./application/use-cases/manage-feature-flags.use-case";
import { GetPlatformStatsUseCase } from "./application/use-cases/get-platform-stats.use-case";
import { AdminUserManagementUseCase } from "./application/use-cases/admin-user-management.use-case";
import { LLMModule } from "../llm/llm.module";
import { AnalyticsModule } from "../analytics/analytics.module";

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || "your-secret-key",
      signOptions: { expiresIn: "60m" },
    }),
    LLMModule,
    AnalyticsModule,
  ],
  controllers: [
    AdminController,
    DashboardController,
    ConfigController,
    AiAnalyticsController,
  ],
  providers: [
    AdminService,
    EncryptionService,
    SecretService,
    ConfigService,
    ManageFeatureFlagsUseCase,
    GetPlatformStatsUseCase,
    AdminUserManagementUseCase,
    { provide: IFeatureFlagsRepository, useClass: PrismaFeatureFlagsRepository },
    { provide: IAuditLogsRepository, useClass: PrismaAuditLogsRepository },
  ],
  exports: [AdminService, EncryptionService, SecretService, ConfigService],
})
export class AdminModule {}
