import { Module, Global } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { PrismaModule } from '../prisma/prisma.module';

import { TelemetryController } from './telemetry.controller';

@Global() // Telemetry is cross-cutting, making it global simplifies usage across modules
@Module({
  imports: [PrismaModule],
  controllers: [TelemetryController],
  providers: [TelemetryService],
  exports: [TelemetryService],
})
export class TelemetryModule {}
