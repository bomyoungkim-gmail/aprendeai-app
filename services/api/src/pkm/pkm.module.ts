import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { DecisionModule } from "../decision/decision.module";
import { PkmGenerationService } from "./application/pkm-generation.service";
import { PkmController } from "./presentation/pkm.controller";
import { PrismaPkmNoteRepository } from "./infrastructure/repositories/prisma-pkm-note.repository";
import { IPkmNoteRepository } from "./domain/repositories/pkm-note.repository.interface";

@Module({
  imports: [PrismaModule, DecisionModule],
  controllers: [PkmController],
  providers: [
    PkmGenerationService,
    {
      provide: IPkmNoteRepository,
      useClass: PrismaPkmNoteRepository,
    },
  ],
  exports: [PkmGenerationService],
})
export class PkmModule {}
