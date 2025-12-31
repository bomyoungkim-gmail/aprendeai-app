import { AssetsService } from "./assets.service";
import { GenerateAssetDto, ListAssetsQueryDto } from "./dto/assets.dto";
export declare class AssetsController {
    private assetsService;
    constructor(assetsService: AssetsService);
    generate(contentId: string, dto: GenerateAssetDto, req: any): Promise<{
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
    list(contentId: string, filters: ListAssetsQueryDto): Promise<{
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
}
