import { Injectable, Inject } from "@nestjs/common";
import { IVocabRepository } from "../../domain/vocab.repository.interface";
import { Vocabulary } from "../../domain/vocabulary.entity";
import { Language, SrsStage } from "@prisma/client";
import { addDays } from "date-fns";

export interface AddVocabItem {
  word: string;
  language: Language;
  contentId?: string;
  exampleNote?: string;
  meaningNote?: string;
}

export interface AddVocabListOutput {
  createdCount: number;
  updatedCount: number;
  items: Vocabulary[];
}

@Injectable()
export class AddVocabListUseCase {
  constructor(
    @Inject(IVocabRepository)
    private readonly vocabRepository: IVocabRepository,
  ) {}

  async execute(
    userId: string,
    items: AddVocabItem[],
  ): Promise<AddVocabListOutput> {
    const createdIds: string[] = [];
    const updatedIds: string[] = [];
    const resultItems: Vocabulary[] = [];

    for (const item of items) {
      const normalized = this.normalizeWord(item.word);

      // Check existing to decide if it's effectively a "create" or "update" for reporting
      // Note: The repo upsert handles the DB operation efficiently, but to return accurate "created/updated" counts
      // we might need to know beforehand or infer from the result.
      // For simplicity/performance, we might assume if created_at ~= now, it's new. Use repository logic for that.

      const result = await this.vocabRepository.upsert(
        userId,
        normalized,
        item.language,
        {
          // Create Data
          word: normalized,
          language: item.language,
          contentId: item.contentId,
          srsStage: SrsStage.NEW,
          dueAt: addDays(new Date(), 1), // Due tomorrow
          exampleNote: item.exampleNote || item.word, // Default example to word itself if missing
          meaningNote: item.meaningNote,
        },
        {
          // Update Data (just metadata updates usually)
          // current service updates last_seen_at and updated_at
        },
      );

      // Heuristic check for "Created vs Updated"
      // If created_at is very recent, it's created.
      const isNew = result.createdAt.getTime() > Date.now() - 2000; // within last 2 seconds

      if (isNew) {
        createdIds.push(result.id);
      } else {
        updatedIds.push(result.id);
      }

      resultItems.push(result);
    }

    return {
      createdCount: createdIds.length,
      updatedCount: updatedIds.length,
      items: resultItems,
    };
  }

  private normalizeWord(word: string): string {
    return word
      .toLowerCase()
      .normalize("NFD") // Decompose accents
      .replace(/[\u0300-\u036f]/g, ""); // Remove diacritics
  }
}
