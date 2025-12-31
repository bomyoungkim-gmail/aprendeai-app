import { PrismaService } from "../prisma/prisma.service";
import { CreateAnnotationDto, UpdateAnnotationDto } from "./dto/annotation.dto";
import { SearchAnnotationsDto } from "./dto/search-annotations.dto";
import { CreateReplyDto } from "./dto/create-reply.dto";
import { StudyGroupsWebSocketGateway } from "../websocket/study-groups-ws.gateway";
export declare class AnnotationService {
    private prisma;
    private wsGateway;
    constructor(prisma: PrismaService, wsGateway: StudyGroupsWebSocketGateway);
    create(contentId: string, userId: string, dto: CreateAnnotationDto): Promise<{
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
    getByContent(contentId: string, userId: string, groupId?: string): Promise<({
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
    update(id: string, userId: string, dto: UpdateAnnotationDto): Promise<{
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
    delete(id: string, userId: string): Promise<{
        deleted: boolean;
    }>;
    searchAnnotations(userId: string, params: SearchAnnotationsDto): Promise<({
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
    createReply(parentId: string, userId: string, dto: CreateReplyDto): Promise<{
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
    toggleFavorite(id: string, userId: string): Promise<{
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
}
