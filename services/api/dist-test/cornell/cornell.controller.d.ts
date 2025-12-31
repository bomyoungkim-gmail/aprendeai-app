import { CornellService } from "./cornell.service";
import { StorageService } from "./services/storage.service";
import { ContentService } from "./services/content.service";
import { QueueService } from "../queue/queue.service";
import { CreateHighlightDto, UpdateCornellDto, UpdateHighlightDto, CreateContentDto, UpdateContentDto } from "./dto/cornell.dto";
import { UploadContentDto } from "./dto/upload-content.dto";
import { NotificationsGateway } from "../notifications/notifications.gateway";
import { CreateContentUseCase } from "./application/use-cases/create-content.use-case";
export declare class CornellController {
    private cornellService;
    private storageService;
    private contentService;
    private queueService;
    private notificationsGateway;
    private createContentUseCase;
    constructor(cornellService: CornellService, storageService: StorageService, contentService: ContentService, queueService: QueueService, notificationsGateway: NotificationsGateway, createContentUseCase: CreateContentUseCase);
    createContent(dto: CreateContentDto, req: any): Promise<{
        id: string;
        type: import(".prisma/client").$Enums.ContentType;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        created_by: string | null;
        created_at: Date;
        updated_at: Date;
        institution_id: string | null;
        source_id: string | null;
        title: string;
        original_language: import(".prisma/client").$Enums.Language;
        raw_text: string;
        scope_type: import(".prisma/client").$Enums.ScopeType;
        file_id: string | null;
        language_guess: string | null;
        owner_user_id: string | null;
        scope_id: string | null;
        source_url: string | null;
        duration: number | null;
        owner_type: string | null;
        owner_id: string | null;
    }>;
    updateContent(id: string, dto: UpdateContentDto, req: any): Promise<{
        id: string;
        type: import(".prisma/client").$Enums.ContentType;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        created_by: string | null;
        created_at: Date;
        updated_at: Date;
        institution_id: string | null;
        source_id: string | null;
        title: string;
        original_language: import(".prisma/client").$Enums.Language;
        raw_text: string;
        scope_type: import(".prisma/client").$Enums.ScopeType;
        file_id: string | null;
        language_guess: string | null;
        owner_user_id: string | null;
        scope_id: string | null;
        source_url: string | null;
        duration: number | null;
        owner_type: string | null;
        owner_id: string | null;
    }>;
    getMyContents(req: any): Promise<{
        id: string;
        title: string;
        type: import(".prisma/client").$Enums.ContentType;
        contentType: import(".prisma/client").$Enums.ContentType;
        original_language: import(".prisma/client").$Enums.Language;
        raw_text: string;
        owner_type: string;
        owner_id: string;
        created_at: Date;
        updated_at: Date;
        metadata: Record<string, any>;
        files: {
            id: string;
            originalFilename: string;
            mimeType: string;
            sizeBytes: number;
            viewUrl?: string;
        };
        file: {
            sizeBytes: number;
            id: string;
            originalFilename: string;
            mimeType: string;
            viewUrl?: string;
        };
    }[]>;
    getContent(id: string, req: any): Promise<{
        id: string;
        title: string;
        type: import(".prisma/client").$Enums.ContentType;
        contentType: import(".prisma/client").$Enums.ContentType;
        original_language: import(".prisma/client").$Enums.Language;
        raw_text: string;
        owner_type: string;
        owner_id: string;
        scope_type: import(".prisma/client").$Enums.ScopeType;
        scope_id: string;
        metadata: Record<string, any>;
        created_at: Date;
        updated_at: Date;
        files: {
            viewUrl: string;
            id: string;
            originalFilename: string;
            mimeType: string;
            sizeBytes: number;
        };
        file: {
            viewUrl: string;
            id: string;
            originalFilename: string;
            mimeType: string;
            sizeBytes: number;
        };
    }>;
    deleteContent(id: string, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    bulkDeleteContents(body: {
        contentIds: string[];
    }, req: any): Promise<{
        success: boolean;
        deleted: number;
        skipped: number;
        message: string;
    }>;
    uploadContent(file: Express.Multer.File, dto: UploadContentDto, req: any): Promise<import("./domain/content.entity").Content>;
    triggerSimplify(id: string, body: {
        text: string;
        level?: string;
        lang?: string;
    }): Promise<{
        message: string;
    }>;
    triggerAssessment(id: string, body: {
        text: string;
        level?: string;
    }): Promise<{
        message: string;
    }>;
    getHighlights(id: string, req: any): Promise<{
        id: string;
        content_id: string;
        user_id: string;
        kind: string;
        target_type: string;
        page_number: number;
        anchor_json: any;
        color_key: string;
        comment_text: string;
        tags_json: string[];
        created_at: Date;
        updated_at: Date;
    }[]>;
    createHighlight(id: string, dto: CreateHighlightDto, req: any): Promise<{
        id: string;
        content_id: string;
        user_id: string;
        kind: string;
        target_type: string;
        page_number: number;
        anchor_json: any;
        color_key: string;
        comment_text: string;
        tags_json: string[];
        created_at: Date;
        updated_at: Date;
    }>;
    getCornellNotes(id: string, req: any): Promise<{
        id: string;
        content_id: string;
        user_id: string;
        cues_json: any[];
        notes_json: any[];
        summary_text: string;
        created_at: Date;
        updated_at: Date;
    }>;
    updateCornellNotes(id: string, dto: UpdateCornellDto, req: any): Promise<{
        id: string;
        cues_json: any[];
        notes_json: any[];
        summary_text: string;
        updated_at: Date;
    }>;
    handleJobComplete(contentId: string, body: {
        type: "simplification" | "assessment";
        success: boolean;
    }): Promise<{
        message: string;
    }>;
}
export declare class HighlightsController {
    private cornellService;
    constructor(cornellService: CornellService);
    updateHighlight(id: string, dto: UpdateHighlightDto, req: any): Promise<{
        id: string;
        color_key: string;
        comment_text: string;
        tags_json: string[];
        updated_at: Date;
    }>;
    deleteHighlight(id: string, req: any): Promise<{
        success: boolean;
    }>;
}
