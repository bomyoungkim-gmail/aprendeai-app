import { PkmNoteStatus } from '@prisma/client';

export interface Backlinks {
  nearDomain: string;
  farDomain: string;
}

export interface SourceMetadata {
  cornellNoteId?: string;
  sectionIds: string[];
  conceptsUsed: string[];
}

export class PkmNote {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly contentId: string | null,
    public readonly sessionId: string | null,
    public readonly missionId: string | null,
    public readonly topicNodeId: string | null, // Link to knowledge graph node
    public readonly title: string,
    public readonly bodyMd: string,
    public readonly tags: string[],
    public readonly backlinks: Backlinks,
    public readonly sourceMetadata: SourceMetadata,
    public readonly status: PkmNoteStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(props: {
    id: string;
    userId: string;
    contentId?: string;
    sessionId?: string;
    missionId?: string;
    topicNodeId?: string;
    title: string;
    bodyMd: string;
    tags?: string[];
    backlinks: Backlinks;
    sourceMetadata: SourceMetadata;
    status?: PkmNoteStatus;
  }): PkmNote {
    return new PkmNote(
      props.id,
      props.userId,
      props.contentId ?? null,
      props.sessionId ?? null,
      props.missionId ?? null,
      props.topicNodeId ?? null,
      props.title,
      props.bodyMd,
      props.tags ?? [],
      props.backlinks,
      props.sourceMetadata,
      props.status ?? PkmNoteStatus.GENERATED,
      new Date(),
      new Date(),
    );
  }

  isGenerated(): boolean {
    return this.status === PkmNoteStatus.GENERATED;
  }

  isSaved(): boolean {
    return this.status === PkmNoteStatus.SAVED;
  }

  isArchived(): boolean {
    return this.status === PkmNoteStatus.ARCHIVED;
  }
}
