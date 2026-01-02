import { Module, Global } from "@nestjs/common";
import { TelemetryService } from "./telemetry.service";
import { PrismaModule } from "../prisma/prisma.module";

import { TelemetryController } from "./telemetry.controller";
import { TelemetryAnalyticsController } from "./analytics.controller";
import { SanitizationService } from "./sanitization.service";
import { AnalyticsService } from "./analytics.service";

@Global() // Telemetry is cross-cutting, making it global simplifies usage across modules
@Module({
  imports: [PrismaModule],
  controllers: [TelemetryController, TelemetryAnalyticsController],
  providers: [TelemetryService, SanitizationService, AnalyticsService],
  exports: [TelemetryService],
})
export class TelemetryModule {}
