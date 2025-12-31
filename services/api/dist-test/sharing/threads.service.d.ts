import { PrismaService } from "../prisma/prisma.service";
import { GetThreadsQuery, CreateCommentRequest } from "./dto/sharing.dto";
export declare class ThreadsService {
    private prisma;
    constructor(prisma: PrismaService);
    getThread(dto: GetThreadsQuery): Promise<{
        comments: ({
            author: {
                id: string;
                name: string;
                avatar_url: string;
            };
        } & {
            id: string;
            created_at: Date;
            deleted_at: Date | null;
            thread_id: string;
            author_id: string;
            body: string;
            deleted_by: string | null;
            delete_reason: string | null;
        })[];
    } & {
        id: string;
        created_at: Date;
        target_type: import(".prisma/client").$Enums.CommentTargetType;
        context_type: import(".prisma/client").$Enums.ShareContextType;
        context_id: string;
        target_id: string;
    }>;
    createComment(threadId: string, userId: string, dto: CreateCommentRequest): Promise<{
        author: {
            id: string;
            name: string;
            avatar_url: string;
        };
    } & {
        id: string;
        created_at: Date;
        deleted_at: Date | null;
        thread_id: string;
        author_id: string;
        body: string;
        deleted_by: string | null;
        delete_reason: string | null;
    }>;
    deleteComment(commentId: string, userId: string): Promise<{
        id: string;
        created_at: Date;
        deleted_at: Date | null;
        thread_id: string;
        author_id: string;
        body: string;
        deleted_by: string | null;
        delete_reason: string | null;
    }>;
    private checkPermission;
}
