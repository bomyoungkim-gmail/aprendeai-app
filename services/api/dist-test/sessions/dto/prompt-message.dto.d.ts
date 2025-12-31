import { ActorRole, UiMode, AssetLayer, ReadingIntent } from "../../common/enums";
export declare class PromptMetadataDto {
    uiMode: UiMode;
    contentId: string;
    assetLayer: AssetLayer;
    readingIntent: ReadingIntent;
    blockId?: string;
    chunkId?: string;
    page?: number;
    span?: {
        start: number;
        end: number;
    };
}
export declare class PromptMessageDto {
    threadId: string;
    readingSessionId: string;
    actorRole: ActorRole;
    text: string;
    clientTs: string;
    metadata: PromptMetadataDto;
}
