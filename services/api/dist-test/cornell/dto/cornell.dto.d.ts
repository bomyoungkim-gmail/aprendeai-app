export declare class UpdateCornellDto {
    cues_json?: any[];
    notes_json?: any[];
    summary_text?: string;
}
export declare class CreateHighlightDto {
    kind: "TEXT" | "AREA";
    target_type: "PDF" | "IMAGE" | "DOCX";
    page_number?: number;
    anchor_json: any;
    color_key?: string;
    comment_text?: string;
    tags_json?: string[];
    timestamp_ms?: number;
    duration_ms?: number;
    visibility?: string;
    visibility_scope?: string;
    context_type?: string;
    context_id?: string;
    learner_id?: string;
}
export declare class UpdateHighlightDto {
    color_key?: string;
    comment_text?: string;
    tags_json?: string[];
}
export declare class CreateContentDto {
    title: string;
    type: "PDF" | "IMAGE" | "DOCX" | "VIDEO" | "AUDIO" | "TEXT";
    originalLanguage?: string;
    rawText?: string;
    duration?: number;
    thumbnailUrl?: string;
    sourceUrl?: string;
}
export declare class UpdateContentDto {
    title?: string;
    duration?: number;
    metadata?: Record<string, any>;
}
