import { Module } from '@nestjs/common';
import { FamilyEventService } from './family-event.service';
import { ClassroomEventService } from './classroom-event.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [FamilyEventService, ClassroomEventService],
  exports: [FamilyEventService, ClassroomEventService],
})
export class EventsModule {}
