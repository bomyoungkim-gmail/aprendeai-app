import { ThreadsService } from "./threads.service";
import { GetThreadsQuery, CreateCommentRequest } from "./dto/sharing.dto";
export declare class ThreadsController {
    private readonly threadsService;
    constructor(threadsService: ThreadsService);
    getThread(query: GetThreadsQuery): Promise<{
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
    createThread(dto: GetThreadsQuery): Promise<{
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
    addComment(threadId: string, dto: CreateCommentRequest, req: any): Promise<{
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
    deleteComment(threadId: string, commentId: string, req: any): Promise<{
        id: string;
        created_at: Date;
        deleted_at: Date | null;
        thread_id: string;
        author_id: string;
        body: string;
        deleted_by: string | null;
        delete_reason: string | null;
    }>;
}
