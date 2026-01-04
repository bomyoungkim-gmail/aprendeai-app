import { PkmNoteStatus } from '@prisma/client';

export class PkmNoteDto {
  id: string;
  userId: string;
  contentId?: string;
  sessionId?: string;
  missionId?: string;
  title: string;
  bodyMd: string;
  tags: string[];
  backlinks: {
    nearDomain: string;
    farDomain: string;
  };
  sourceMetadata: {
    cornellNoteId?: string;
    sectionIds: string[];
    conceptsUsed: string[];
  };
  status: PkmNoteStatus;
  createdAt: Date;
  updatedAt: Date;
}
