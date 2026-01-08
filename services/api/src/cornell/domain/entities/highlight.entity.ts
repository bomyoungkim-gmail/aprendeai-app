export class Highlight {
  id: string;
  contentId: string;
  userId: string;
  kind: string; // HighlightKind enum
  targetType: string; // ContentType enum
  type?: string; // Pedagogical type: EVIDENCE, VOCABULARY, MAIN_IDEA, DOUBT
  pageNumber?: number;
  anchor: any; // JSON
  colorKey: string;
  commentText?: string;
  tags: string[]; // JSON
  timestampMs?: number;
  durationMs?: number;

  // Social / RBAC fields
  visibility?: string; // AnnotationVisibility
  visibilityScope?: string; // VisibilityScope
  contextType?: string; // ContextType
  contextId?: string;
  learnerId?: string;
  status?: string; // AnnotationStatus

  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<Highlight>) {
    Object.assign(this, partial);
  }
}
