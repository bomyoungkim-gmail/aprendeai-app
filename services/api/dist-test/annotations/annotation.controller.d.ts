import { Response } from "express";
import { AnnotationService } from "./annotation.service";
import { AnnotationExportService } from "./annotation-export.service";
import { CreateAnnotationDto, UpdateAnnotationDto } from "./dto/annotation.dto";
import { SearchAnnotationsDto } from "./dto/search-annotations.dto";
import { CreateReplyDto } from "./dto/create-reply.dto";
import { SharingService } from "../sharing/sharing.service";
import { ShareAnnotationRequest, ShareContextType } from "../sharing/dto/sharing.dto";
export declare class AnnotationController {
    private annotationService;
    constructor(annotationService: AnnotationService);
    create(contentId: string, dto: CreateAnnotationDto, req: any): Promise<{
        annotations: {
            id: string;
            text: string;
        };
        users: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        type: import(".prisma/client").$Enums.AnnotationType;
        created_at: Date;
        updated_at: Date;
        text: string | null;
        content_id: string;
        user_id: string;
        group_id: string | null;
        start_offset: number;
        end_offset: number;
        selected_text: string | null;
        color: string | null;
        visibility: import(".prisma/client").$Enums.AnnotationVisibility;
        parent_id: string | null;
        is_favorite: boolean;
    }>;
    getAll(contentId: string, groupId: string, req: any): Promise<({
        users: {
            id: string;
            name: string;
        };
        other_annotations: ({
            users: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            type: import(".prisma/client").$Enums.AnnotationType;
            created_at: Date;
            updated_at: Date;
            text: string | null;
            content_id: string;
            user_id: string;
            group_id: string | null;
            start_offset: number;
            end_offset: number;
            selected_text: string | null;
            color: string | null;
            visibility: import(".prisma/client").$Enums.AnnotationVisibility;
            parent_id: string | null;
            is_favorite: boolean;
        })[];
    } & {
        id: string;
        type: import(".prisma/client").$Enums.AnnotationType;
        created_at: Date;
        updated_at: Date;
        text: string | null;
        content_id: string;
        user_id: string;
        group_id: string | null;
        start_offset: number;
        end_offset: number;
        selected_text: string | null;
        color: string | null;
        visibility: import(".prisma/client").$Enums.AnnotationVisibility;
        parent_id: string | null;
        is_favorite: boolean;
    })[]>;
    update(id: string, dto: UpdateAnnotationDto, req: any): Promise<{
        users: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        type: import(".prisma/client").$Enums.AnnotationType;
        created_at: Date;
        updated_at: Date;
        text: string | null;
        content_id: string;
        user_id: string;
        group_id: string | null;
        start_offset: number;
        end_offset: number;
        selected_text: string | null;
        color: string | null;
        visibility: import(".prisma/client").$Enums.AnnotationVisibility;
        parent_id: string | null;
        is_favorite: boolean;
    }>;
    delete(id: string, req: any): Promise<{
        deleted: boolean;
    }>;
}
export declare class AnnotationSearchController {
    private annotationService;
    private exportService;
    private sharingService;
    constructor(annotationService: AnnotationService, exportService: AnnotationExportService, sharingService: SharingService);
    search(params: SearchAnnotationsDto, req: any): Promise<({
        contents: {
            id: string;
            title: string;
        };
        users: {
            id: string;
            name: string;
        };
        other_annotations: ({
            users: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            type: import(".prisma/client").$Enums.AnnotationType;
            created_at: Date;
            updated_at: Date;
            text: string | null;
            content_id: string;
            user_id: string;
            group_id: string | null;
            start_offset: number;
            end_offset: number;
            selected_text: string | null;
            color: string | null;
            visibility: import(".prisma/client").$Enums.AnnotationVisibility;
            parent_id: string | null;
            is_favorite: boolean;
        })[];
    } & {
        id: string;
        type: import(".prisma/client").$Enums.AnnotationType;
        created_at: Date;
        updated_at: Date;
        text: string | null;
        content_id: string;
        user_id: string;
        group_id: string | null;
        start_offset: number;
        end_offset: number;
        selected_text: string | null;
        color: string | null;
        visibility: import(".prisma/client").$Enums.AnnotationVisibility;
        parent_id: string | null;
        is_favorite: boolean;
    })[]>;
    createReply(annotationId: string, dto: CreateReplyDto, req: any): Promise<{
        annotations: {
            id: string;
            type: import(".prisma/client").$Enums.AnnotationType;
            created_at: Date;
            updated_at: Date;
            text: string | null;
            content_id: string;
            user_id: string;
            group_id: string | null;
            start_offset: number;
            end_offset: number;
            selected_text: string | null;
            color: string | null;
            visibility: import(".prisma/client").$Enums.AnnotationVisibility;
            parent_id: string | null;
            is_favorite: boolean;
        };
        users: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        type: import(".prisma/client").$Enums.AnnotationType;
        created_at: Date;
        updated_at: Date;
        text: string | null;
        content_id: string;
        user_id: string;
        group_id: string | null;
        start_offset: number;
        end_offset: number;
        selected_text: string | null;
        color: string | null;
        visibility: import(".prisma/client").$Enums.AnnotationVisibility;
        parent_id: string | null;
        is_favorite: boolean;
    }>;
    toggleFavorite(id: string, req: any): Promise<{
        users: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        type: import(".prisma/client").$Enums.AnnotationType;
        created_at: Date;
        updated_at: Date;
        text: string | null;
        content_id: string;
        user_id: string;
        group_id: string | null;
        start_offset: number;
        end_offset: number;
        selected_text: string | null;
        color: string | null;
        visibility: import(".prisma/client").$Enums.AnnotationVisibility;
        parent_id: string | null;
        is_favorite: boolean;
    }>;
    exportAnnotations(format: "pdf" | "markdown", req: any, res: Response): Promise<Response<any, Record<string, any>>>;
    share(annotationId: string, dto: ShareAnnotationRequest, req: any): Promise<import("../sharing/domain/entities/annotation-share.entity").AnnotationShare>;
    revokeShare(annotationId: string, contextType: ShareContextType, contextId: string, req: any): Promise<void>;
}
