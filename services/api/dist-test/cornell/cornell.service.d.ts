import { EventEmitter2 } from "@nestjs/event-emitter";
import { PrismaService } from "../prisma/prisma.service";
import { UsageTrackingService } from "../billing/usage-tracking.service";
import { ActivityService } from "../activity/activity.service";
import { ContentAccessService } from "./services/content-access.service";
import type { UpdateCornellDto, CreateHighlightDto, UpdateHighlightDto, UpdateContentDto } from "./dto/cornell.dto";
import { GetContentUseCase } from "./application/use-cases/get-content.use-case";
import { ListContentUseCase } from "./application/use-cases/list-content.use-case";
import { UpdateContentUseCase } from "./application/use-cases/update-content.use-case";
import { DeleteContentUseCase } from "./application/use-cases/delete-content.use-case";
import { GetOrCreateCornellNoteUseCase } from "./application/use-cases/get-or-create-cornell-note.use-case";
import { UpdateCornellNoteUseCase } from "./application/use-cases/update-cornell-note.use-case";
import { CreateHighlightUseCase } from "./application/use-cases/create-highlight.use-case";
import { UpdateHighlightUseCase } from "./application/use-cases/update-highlight.use-case";
import { DeleteHighlightUseCase } from "./application/use-cases/delete-highlight.use-case";
import { GetHighlightsUseCase } from "./application/use-cases/get-highlights.use-case";
export declare class CornellService {
    private prisma;
    private usageTracking;
    private activityService;
    private eventEmitter;
    private contentAccessService;
    private getContentUseCase;
    private listContentUseCase;
    private updateContentUseCase;
    private deleteContentUseCase;
    private getOrCreateCornellNoteUseCase;
    private updateCornellNoteUseCase;
    private createHighlightUseCase;
    private updateHighlightUseCase;
    private deleteHighlightUseCase;
    private getHighlightsUseCase;
    constructor(prisma: PrismaService, usageTracking: UsageTrackingService, activityService: ActivityService, eventEmitter: EventEmitter2, contentAccessService: ContentAccessService, getContentUseCase: GetContentUseCase, listContentUseCase: ListContentUseCase, updateContentUseCase: UpdateContentUseCase, deleteContentUseCase: DeleteContentUseCase, getOrCreateCornellNoteUseCase: GetOrCreateCornellNoteUseCase, updateCornellNoteUseCase: UpdateCornellNoteUseCase, createHighlightUseCase: CreateHighlightUseCase, updateHighlightUseCase: UpdateHighlightUseCase, deleteHighlightUseCase: DeleteHighlightUseCase, getHighlightsUseCase: GetHighlightsUseCase);
    private getEnvironment;
    getMyContents(userId: string): Promise<{
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
    getContent(contentId: string, userId: string): Promise<{
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
    updateContent(id: string, userId: string, dto: UpdateContentDto): Promise<{
        id: string;
        title: string;
        metadata: Record<string, any>;
        updated_at: Date;
    }>;
    deleteContent(contentId: string, userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    bulkDeleteContents(contentIds: string[], userId: string): Promise<{
        success: boolean;
        deleted: number;
        skipped: number;
        message: string;
    }>;
    getOrCreateCornellNotes(contentId: string, userId: string): Promise<{
        id: string;
        content_id: string;
        user_id: string;
        cues_json: any[];
        notes_json: any[];
        summary_text: string;
        created_at: Date;
        updated_at: Date;
    }>;
    updateCornellNotes(contentId: string, dto: UpdateCornellDto, userId: string): Promise<{
        id: string;
        cues_json: any[];
        notes_json: any[];
        summary_text: string;
        updated_at: Date;
    }>;
    getHighlights(contentId: string, userId: string): Promise<{
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
    createHighlight(contentId: string, dto: CreateHighlightDto, userId: string): Promise<{
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
    updateHighlight(id: string, dto: UpdateHighlightDto, userId: string): Promise<{
        id: string;
        color_key: string;
        comment_text: string;
        tags_json: string[];
        updated_at: Date;
    }>;
    deleteHighlight(id: string, userId: string): Promise<{
        success: boolean;
    }>;
}
