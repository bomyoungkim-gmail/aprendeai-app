import { PrismaService } from "../prisma/prisma.service";
import { QueueService } from "../queue/queue.service";
import { EntitlementsService } from "../billing/entitlements.service";
import { UsageTrackingService } from "../billing/usage-tracking.service";
export declare class ExtractionService {
    private prisma;
    private queue;
    private entitlements;
    private usageTracking;
    constructor(prisma: PrismaService, queue: QueueService, entitlements: EntitlementsService, usageTracking: UsageTrackingService);
    requestExtraction(contentId: string, userId: string): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        content_id: string;
        status: import(".prisma/client").$Enums.ExtractionStatus;
        extracted_text_ref: string | null;
        metadata_json: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    getExtractionStatus(contentId: string): Promise<{
        contents: {
            type: import(".prisma/client").$Enums.ContentType;
            title: string;
        };
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        content_id: string;
        status: import(".prisma/client").$Enums.ExtractionStatus;
        extracted_text_ref: string | null;
        metadata_json: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    getChunks(contentId: string, page?: number, range?: string): Promise<{
        id: string;
        created_at: Date;
        text: string;
        content_id: string;
        chunk_index: number;
        page_number: number | null;
        token_estimate: number | null;
    }[]>;
}
