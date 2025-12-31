import { PrismaService } from "../prisma/prisma.service";
import { EntitlementsService } from "../billing/entitlements.service";
import { QueueService } from "../queue/queue.service";
import { GenerateAssetDto } from "./dto/assets.dto";
export declare class AssetsService {
    private prisma;
    private entitlements;
    private queue;
    constructor(prisma: PrismaService, entitlements: EntitlementsService, queue: QueueService);
    generateAsset(userId: string, contentId: string, dto: GenerateAssetDto): Promise<{
        jobId: any;
        status: "completed";
        asset: {
            id: string;
            created_at: Date;
            updated_at: Date;
            content_id: string;
            layer: import(".prisma/client").$Enums.AssetLayer;
            modality: import(".prisma/client").$Enums.SessionModality;
            cues_json: import("@prisma/client/runtime/library").JsonValue | null;
            checkpoints_json: import("@prisma/client/runtime/library").JsonValue | null;
            body_ref: string | null;
            glossary_json: import("@prisma/client/runtime/library").JsonValue | null;
            quiz_post_json: import("@prisma/client/runtime/library").JsonValue | null;
            difficulty_estimate: number | null;
            length_estimate: number | null;
            prompt_version: string;
        };
        estimatedTime?: undefined;
    } | {
        jobId: `${string}-${string}-${string}-${string}-${string}`;
        status: "queued";
        estimatedTime: number;
        asset?: undefined;
    }>;
    getAssets(contentId: string, filters: any): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        content_id: string;
        layer: import(".prisma/client").$Enums.AssetLayer;
        modality: import(".prisma/client").$Enums.SessionModality;
        cues_json: import("@prisma/client/runtime/library").JsonValue | null;
        checkpoints_json: import("@prisma/client/runtime/library").JsonValue | null;
        body_ref: string | null;
        glossary_json: import("@prisma/client/runtime/library").JsonValue | null;
        quiz_post_json: import("@prisma/client/runtime/library").JsonValue | null;
        difficulty_estimate: number | null;
        length_estimate: number | null;
        prompt_version: string;
    }[]>;
    private calculateCacheHash;
    private checkUsageLimits;
}
