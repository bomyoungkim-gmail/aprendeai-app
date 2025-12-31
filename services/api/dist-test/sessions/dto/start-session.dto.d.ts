import { AssetLayer, ReadingIntent } from "../../common/enums";
export declare class LongTextConfigDto {
    planId?: string;
    unitIndex?: number;
}
export declare class StartSessionDto {
    contentId: string;
    contentVersionId?: string;
    assetLayer?: AssetLayer;
    readingIntent?: ReadingIntent;
    timeboxMin?: number;
    longText?: LongTextConfigDto;
}
export declare class FinishSessionDto {
    reason: "USER_FINISHED" | "TIMEOUT" | "ERROR";
}
