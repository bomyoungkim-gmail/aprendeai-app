import { MessageEvent } from "@nestjs/common";
import { Observable } from "rxjs";
import { CornellHighlightsService } from "../services/cornell-highlights.service";
import { CreateCornellHighlightDto, UpdateHighlightVisibilityDto, CreateAnnotationCommentDto } from "../dto/create-cornell-highlight.dto";
export declare class CornellHighlightsController {
    private readonly highlightsService;
    constructor(highlightsService: CornellHighlightsService);
    createHighlight(contentId: string, userId: string, dto: CreateCornellHighlightDto): Promise<{
        users: {
            id: string;
            name: string;
            email: string;
        };
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        content_id: string;
        status: import(".prisma/client").$Enums.AnnotationStatus;
        user_id: string;
        visibility: import(".prisma/client").$Enums.AnnotationVisibility;
        learner_id: string | null;
        kind: import(".prisma/client").$Enums.HighlightKind;
        page_number: number | null;
        target_type: import(".prisma/client").$Enums.TargetType;
        anchor_json: import("@prisma/client/runtime/library").JsonValue;
        color_key: string;
        comment_text: string | null;
        tags_json: import("@prisma/client/runtime/library").JsonValue;
        timestamp_ms: number | null;
        duration_ms: number | null;
        visibility_scope: import(".prisma/client").$Enums.VisibilityScope | null;
        context_type: import(".prisma/client").$Enums.ContextType | null;
        context_id: string | null;
        deleted_at: Date | null;
    }>;
    getHighlights(contentId: string, userId: string): Promise<({
        annotation_comments: ({
            users: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            created_at: Date;
            updated_at: Date;
            text: string;
            status: import(".prisma/client").$Enums.AnnotationStatus;
            user_id: string;
            deleted_at: Date | null;
            highlight_id: string;
        })[];
        users: {
            id: string;
            name: string;
            email: string;
        };
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        content_id: string;
        status: import(".prisma/client").$Enums.AnnotationStatus;
        user_id: string;
        visibility: import(".prisma/client").$Enums.AnnotationVisibility;
        learner_id: string | null;
        kind: import(".prisma/client").$Enums.HighlightKind;
        page_number: number | null;
        target_type: import(".prisma/client").$Enums.TargetType;
        anchor_json: import("@prisma/client/runtime/library").JsonValue;
        color_key: string;
        comment_text: string | null;
        tags_json: import("@prisma/client/runtime/library").JsonValue;
        timestamp_ms: number | null;
        duration_ms: number | null;
        visibility_scope: import(".prisma/client").$Enums.VisibilityScope | null;
        context_type: import(".prisma/client").$Enums.ContextType | null;
        context_id: string | null;
        deleted_at: Date | null;
    })[]>;
    updateVisibility(highlightId: string, userId: string, dto: UpdateHighlightVisibilityDto): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        content_id: string;
        status: import(".prisma/client").$Enums.AnnotationStatus;
        user_id: string;
        visibility: import(".prisma/client").$Enums.AnnotationVisibility;
        learner_id: string | null;
        kind: import(".prisma/client").$Enums.HighlightKind;
        page_number: number | null;
        target_type: import(".prisma/client").$Enums.TargetType;
        anchor_json: import("@prisma/client/runtime/library").JsonValue;
        color_key: string;
        comment_text: string | null;
        tags_json: import("@prisma/client/runtime/library").JsonValue;
        timestamp_ms: number | null;
        duration_ms: number | null;
        visibility_scope: import(".prisma/client").$Enums.VisibilityScope | null;
        context_type: import(".prisma/client").$Enums.ContextType | null;
        context_id: string | null;
        deleted_at: Date | null;
    }>;
    deleteHighlight(highlightId: string, userId: string): Promise<void>;
    createComment(highlightId: string, userId: string, dto: CreateAnnotationCommentDto): Promise<{
        users: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        text: string;
        status: import(".prisma/client").$Enums.AnnotationStatus;
        user_id: string;
        deleted_at: Date | null;
        highlight_id: string;
    }>;
    events(contentId: string): Observable<MessageEvent>;
}
