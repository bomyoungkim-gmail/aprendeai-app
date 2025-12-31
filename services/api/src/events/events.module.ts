import { Module } from "@nestjs/common";
import { FamilyEventService } from "./family-event.service";
import { ClassroomEventService } from "./classroom-event.service";
import { PrismaModule } from "../prisma/prisma.module";
import { PrismaEventRepository } from "./infrastructure/repositories/prisma-event.repository";
import { LogEventUseCase } from "./application/use-cases/log-event.use-case";

import { IEventRepository } from "./domain/interfaces/event.repository.interface";

@Module({
  imports: [PrismaModule],
  providers: [
    FamilyEventService,
    ClassroomEventService,
    LogEventUseCase,
    { provide: IEventRepository, useClass: PrismaEventRepository },
  ],
  exports: [FamilyEventService, ClassroomEventService, IEventRepository],
})
export class EventsModule {}
