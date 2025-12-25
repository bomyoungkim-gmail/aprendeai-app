import { Module } from '@nestjs/common';
import { SessionTrackingService } from './session-tracking.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SessionTrackingService],
  exports: [SessionTrackingService],
})
export class SessionTrackingModule {}
