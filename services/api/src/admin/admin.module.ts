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
import { LLMModule } from "../llm/llm.module";
import { ObservabilityModule } from "../observability/observability.module";

@Module({
  imports: [
    PrismaModule,
    LLMModule,
    ObservabilityModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || "your-secret-key",
      signOptions: { expiresIn: "60m" },
    }),
  ],
  controllers: [AdminController, DashboardController, ConfigController],
  providers: [AdminService, EncryptionService, SecretService, ConfigService],
  exports: [AdminService, EncryptionService, SecretService, ConfigService],
})
export class AdminModule {}
