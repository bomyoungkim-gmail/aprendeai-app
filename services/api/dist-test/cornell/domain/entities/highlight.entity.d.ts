export declare class Highlight {
    id: string;
    contentId: string;
    userId: string;
    kind: string;
    targetType: string;
    pageNumber?: number;
    anchor: any;
    colorKey: string;
    commentText?: string;
    tags: string[];
    timestampMs?: number;
    durationMs?: number;
    visibility?: string;
    visibilityScope?: string;
    contextType?: string;
    contextId?: string;
    learnerId?: string;
    status?: string;
    createdAt: Date;
    updatedAt: Date;
    constructor(partial: Partial<Highlight>);
}
