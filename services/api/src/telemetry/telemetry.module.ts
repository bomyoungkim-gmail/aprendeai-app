import { Module, Global } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { PrismaModule } from '../prisma/prisma.module';

import { TelemetryController } from './telemetry.controller';
import { TelemetryAnalyticsController } from './analytics.controller';

@Global() // Telemetry is cross-cutting, making it global simplifies usage across modules
@Module({
  imports: [PrismaModule],
  controllers: [TelemetryController, TelemetryAnalyticsController],
  providers: [TelemetryService],
  exports: [TelemetryService],
})
export class TelemetryModule {}
