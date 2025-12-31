import { AnnotationVisibility, TargetType, VisibilityScope, ContextType } from "../../common/constants/enums";
import { CornellType } from "../constants/cornell-type-map";
export interface AnchorGeometry {
    x: number;
    y: number;
    width: number;
    height: number;
}
export declare class CreateCornellHighlightDto {
    type: Exclude<CornellType, "SUMMARY" | "AI_RESPONSE">;
    target_type: TargetType;
    page_number?: number;
    anchor_json?: AnchorGeometry;
    timestamp_ms?: number;
    duration_ms?: number;
    comment_text?: string;
    visibility?: AnnotationVisibility;
    visibility_scope?: VisibilityScope;
    context_type?: ContextType;
    context_id?: string;
    learner_id?: string;
    get color_key(): string;
    get tags_json(): string[];
}
export declare class UpdateHighlightVisibilityDto {
    visibility: AnnotationVisibility;
    visibility_scope?: VisibilityScope;
    context_type?: ContextType;
    context_id?: string;
    learner_id?: string;
}
export declare class CreateAnnotationCommentDto {
    text: string;
}
