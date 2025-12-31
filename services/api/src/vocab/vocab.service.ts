import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { addDays } from "date-fns";
import * as crypto from "crypto";
import { GetVocabListUseCase } from "./application/use-cases/get-vocab-list.use-case";
import { AddVocabListUseCase } from "./application/use-cases/add-vocab-list.use-case";

@Injectable()
export class VocabService {
  constructor(
    private prisma: PrismaService,
    private readonly getVocabListUseCase: GetVocabListUseCase,
    private readonly addVocabListUseCase: AddVocabListUseCase
  ) {}

  /**
   * Normalize word for consistent storage
   * @deprecated logic moved to AddVocabListUseCase, kept for reference or legacy direct formatting
   */
  normalizeWord(word: string): string {
    return word
      .toLowerCase()
      .normalize("NFD") // Decompose accents
      .replace(/[\u0300-\u036f]/g, ""); // Remove diacritics
  }

  /**
   * Create vocabulary items from session target words
   * DECISION 6: Detect language from content
   */
  async createFromTargetWords(sessionId: string) {
    const session = await this.prisma.reading_sessions.findUnique({
      where: { id: sessionId },
      select: {
        user_id: true,
        content_id: true,
        target_words_json: true,
        contents: {
          select: { original_language: true },
        },
      },
    });

    if (!session || !session.target_words_json) {
      return { created: 0, updated: 0, vocabItems: [] };
    }

    const words = session.target_words_json as string[];
    const language = session.contents.original_language;

    const items = words.map((word) => ({
      word,
      language: language,
      contentId: session.content_id,
      exampleNote: word, // Original word as example
    }));

    const result = await this.addVocabListUseCase.execute(
      session.user_id,
      items
    );

    return {
      created: result.createdCount,
      updated: result.updatedCount,
      vocabItems: result.items,
    };
  }

  /**
   * Create vocabulary from unknown words marked during session
   */
  async createFromUnknownWords(sessionId: string) {
    const events = await this.prisma.session_events.findMany({
      where: {
        reading_session_id: sessionId,
        event_type: "MARK_UNKNOWN_WORD",
      },
      select: {
        payload_json: true,
      },
    });

    const session = await this.prisma.reading_sessions.findUnique({
      where: { id: sessionId },
      select: {
        user_id: true,
        content_id: true,
        contents: { select: { original_language: true } },
      },
    });

    if (!session) return { created: 0, vocabItems: [] };

    const items = events
      .map((event) => {
        const payload = event.payload_json as any;
        const term = payload.term;
        if (!term) return null;

        return {
          word: term,
          language: session.contents.original_language,
          contentId: session.content_id,
          exampleNote: payload.context || term, // Use context if available
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const result = await this.addVocabListUseCase.execute(
      session.user_id,
      items
    );

    return {
      created: result.createdCount,
      vocabItems: result.items,
    };
  }

  /**
   * Get user's vocabulary with filters
   */
  async getUserVocab(
    userId: string,
    filters?: {
      language?: string;
      srsStage?: string;
      dueOnly?: boolean;
    }
  ) {
    return this.getVocabListUseCase.execute({
      userId,
      language: filters?.language,
      srsStage: filters?.srsStage,
      dueOnly: filters?.dueOnly,
    });
  }
}
