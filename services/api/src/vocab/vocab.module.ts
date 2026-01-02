import { Module } from "@nestjs/common";
import { VocabService } from "./vocab.service";
import { VocabController } from "./vocab.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { PrismaVocabRepository } from "./infrastructure/repositories/prisma-vocab.repository";
import { IVocabRepository } from "./domain/vocab.repository.interface";
import { GetVocabListUseCase } from "./application/use-cases/get-vocab-list.use-case";
import { AddVocabListUseCase } from "./application/use-cases/add-vocab-list.use-case";

@Module({
  imports: [PrismaModule],
  controllers: [VocabController],
  providers: [
    VocabService,
    GetVocabListUseCase,
    AddVocabListUseCase,
    {
      provide: IVocabRepository,
      useClass: PrismaVocabRepository,
    },
  ],
  exports: [
    VocabService,
    GetVocabListUseCase,
    AddVocabListUseCase,
    IVocabRepository,
  ],
})
export class VocabModule {}
