import { Language, SrsStage } from "@prisma/client";

export class Vocabulary {
  id: string;
  userId: string;
  word: string;
  language: Language;
  masteryScore: number;
  lastSeenAt: Date;
  srsStage: SrsStage;
  dueAt: Date;
  lapsesCount: number;
  masteryForm: number;
  masteryMeaning: number;
  masteryUse: number;
  contentId?: string;
  meaningNote?: string;
  exampleNote?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<Vocabulary>) {
    Object.assign(this, partial);
    this.masteryScore = partial.masteryScore ?? 0;
    this.lapsesCount = partial.lapsesCount ?? 0;
  }
}
