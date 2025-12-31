import { ContentType, Language, ScopeType } from "@prisma/client";

export class Content {
  id: string;
  title: string;
  type: ContentType;
  originalLanguage: Language;
  rawText?: string;
  ownerType: string;
  ownerId: string;
  scopeType: ScopeType;
  scopeId?: string;
  metadata?: Record<string, any>;
  file?: {
      id: string;
      originalFilename: string;
      mimeType: string;
      sizeBytes: number;
      viewUrl?: string; // Hydrated by service if needed
  };
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<Content>) {
    Object.assign(this, partial);
    Object.assign(this, partial);
  }
}

export class ContentVersion {
    id: string;
    contentId: string;
    targetLanguage: Language;
    schoolingLevelTarget: string;
    simplifiedText?: string;
    summary?: string; 
    createdAt?: Date;

    constructor(partial: Partial<ContentVersion>) {
        Object.assign(this, partial);
    }
}
