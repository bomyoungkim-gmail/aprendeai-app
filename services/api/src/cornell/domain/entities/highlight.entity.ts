
export class Highlight {
  id: string;
  contentId: string;
  userId: string;
  kind: string; // HighlightKind enum
  targetType: string; // TargetType enum
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
