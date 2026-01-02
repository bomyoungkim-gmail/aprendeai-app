import { Injectable, Inject } from "@nestjs/common";
import { IVocabRepository } from "../../domain/vocab.repository.interface";
import { Vocabulary } from "../../domain/vocabulary.entity";
import { Language, SrsStage } from "@prisma/client";

export interface GetVocabListInput {
  userId: string;
  language?: string;
  srsStage?: string;
  dueOnly?: boolean;
}

@Injectable()
export class GetVocabListUseCase {
  constructor(
    @Inject(IVocabRepository)
    private readonly vocabRepository: IVocabRepository,
  ) {}

  async execute(input: GetVocabListInput): Promise<Vocabulary[]> {
    return this.vocabRepository.findAll(input.userId, {
      language: input.language as Language,
      srsStage: input.srsStage as SrsStage,
      dueOnly: input.dueOnly,
    });
  }
}
