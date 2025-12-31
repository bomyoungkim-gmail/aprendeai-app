import { Module, forwardRef } from "@nestjs/common";
import { OutcomesService } from "./outcomes.service";
import { PrismaModule } from "../prisma/prisma.module";
import { IOutcomesRepository } from "./domain/outcomes.repository.interface";
import { PrismaOutcomesRepository } from "./infrastructure/repositories/prisma-outcomes.repository";
import { ComputeSessionOutcomesUseCase } from "./application/use-cases/compute-session-outcomes.use-case";
import { SessionsModule } from "../sessions/sessions.module";
import { CornellModule } from "../cornell/cornell.module";

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => SessionsModule),
    CornellModule,
  ],
  providers: [
    OutcomesService,
    ComputeSessionOutcomesUseCase,
    {
      provide: IOutcomesRepository,
      useClass: PrismaOutcomesRepository,
    },
  ],
  exports: [OutcomesService, ComputeSessionOutcomesUseCase, IOutcomesRepository],
})
export class OutcomesModule {}
