import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { addDays } from 'date-fns';

@Injectable()
export class VocabService {
  constructor(private prisma: PrismaService) {}

  /**
   * Normalize word for consistent storage
   * DECISION 5: Lowercase + NFD normalization
   */
  normalizeWord(word: string): string {
    return word
      .toLowerCase()
      .normalize('NFD') // Decompose accents
      .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics
    // "Café" → "cafe"
    // "naïve" → "naive"
  }

  /**
   * Create vocabulary items from session target words
   * DECISION 6: Detect language from content
   */
  async createFromTargetWords(sessionId: string) {
    const session = await this.prisma.readingSession.findUnique({
      where: { id: sessionId },
      select: {
        userId: true,
        contentId: true,
        targetWordsJson: true,
        content: {
          select: { originalLanguage: true },
        },
      },
    });

    if (!session || !session.targetWordsJson) {
      return { created: 0, updated: 0, vocabItems: [] };
    }

    const words = session.targetWordsJson as string[];
    const language = session.content.originalLanguage;
    const created: string[] = [];
    const updated: string[] = [];

    for (const word of words) {
      const normalized = this.normalizeWord(word);

      const result = await this.prisma.userVocabulary.upsert({
        where: {
          userId_word_language: {
            userId: session.userId,
            word: normalized,
            language: language,
          },
        },
        create: {
          userId: session.userId,
          word: normalized,
          language: language,
          contentId: session.contentId,
          srsStage: 'NEW',
          dueAt: addDays(new Date(), 1), // Due tomorrow
          exampleNote: word, // Store original with accents
        },
        update: {
          lastSeenAt: new Date(),
          // If already exists, just update lastSeenAt
        },
      });

      if (result.createdAt.getTime() === new Date().getTime()) {
        created.push(result.id);
      } else {
        updated.push(result.id);
      }
    }

    const vocabItems = await this.prisma.userVocabulary.findMany({
      where: {
        id: { in: [...created, ...updated] },
      },
    });

    return {
      created: created.length,
      updated: updated.length,
      vocabItems,
    };
  }

  /**
   * Create vocabulary from unknown words marked during session
   */
  async createFromUnknownWords(sessionId: string) {
    const events = await this.prisma.sessionEvent.findMany({
      where: {
        readingSessionId: sessionId,
        eventType: 'MARK_UNKNOWN_WORD',
      },
      select: {
        payloadJson: true,
      },
    });

    const session = await this.prisma.readingSession.findUnique({
      where: { id: sessionId },
      select: {
        userId: true,
        contentId: true,
        content: { select: { originalLanguage: true } },
      },
    });

    if (!session) return { created: 0, vocabItems: [] };

    const created: string[] = [];

    for (const event of events) {
      const payload = event.payloadJson as any;
      const term = payload.term;

      if (!term) continue;

      const normalized = this.normalizeWord(term);

      const vocab = await this.prisma.userVocabulary.upsert({
        where: {
          userId_word_language: {
            userId: session.userId,
            word: normalized,
            language: session.content.originalLanguage,
          },
        },
        create: {
          userId: session.userId,
          word: normalized,
          language: session.content.originalLanguage,
          contentId: session.contentId,
          srsStage: 'NEW',
          dueAt: addDays(new Date(), 1),
          exampleNote: payload.context || term,
        },
        update: {
          lastSeenAt: new Date(),
        },
      });

      created.push(vocab.id);
    }

    const vocabItems = await this.prisma.userVocabulary.findMany({
      where: { id: { in: created } },
    });

    return { created: created.length, vocabItems };
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
    },
  ) {
    return this.prisma.userVocabulary.findMany({
      where: {
        userId,
        ...(filters?.language && { language: filters.language as any }),
        ...(filters?.srsStage && { srsStage: filters.srsStage as any }),
        ...(filters?.dueOnly && { dueAt: { lte: new Date() } }),
      },
      include: {
        content: {
          select: { id: true, title: true },
        },
      },
      orderBy: [{ dueAt: 'asc' }, { lapsesCount: 'desc' }],
    });
  }
}
