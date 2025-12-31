export declare enum CaptureMode {
    SELECTION = "SELECTION",
    READABILITY = "READABILITY"
}
export declare class CreateWebClipDto {
    sourceUrl: string;
    title: string;
    siteDomain: string;
    captureMode: CaptureMode;
    selectionText?: string;
    contentText?: string;
    languageHint?: "PT_BR" | "EN" | "KO";
    tags?: string[];
}
export declare class StartWebClipSessionDto {
    assetLayer?: string;
    readingIntent?: "inspectional" | "analytical";
    timeboxMin?: number;
}
