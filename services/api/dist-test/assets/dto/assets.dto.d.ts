import { AssetLayer, SessionModality } from "@prisma/client";
export declare class GenerateAssetDto {
    layer: AssetLayer;
    educationLevel: string;
    modality: SessionModality;
    selectedHighlightIds?: string[];
    promptVersion?: string;
}
export declare class AssetResponseDto {
    jobId?: string;
    status: "queued" | "processing" | "completed" | "failed";
    asset?: any;
    estimatedTime?: number;
}
export declare class ListAssetsQueryDto {
    layer?: AssetLayer;
    promptVersion?: string;
}
