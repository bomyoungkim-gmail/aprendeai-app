export type CornellType = "HIGHLIGHT" | "NOTE" | "STAR" | "QUESTION" | "SUMMARY" | "AI_RESPONSE";
export type ColorKey = "red" | "yellow" | "green" | "blue" | "purple" | "pink" | "orange";
export declare const CORNELL_TYPE_COLOR_MAP: Record<Exclude<CornellType, "AI_RESPONSE">, ColorKey>;
export declare const CORNELL_TYPE_TAGS: Record<CornellType, string[]>;
export declare function getColorForType(type: CornellType): ColorKey;
export declare function getTagsForType(type: CornellType): string[];
export declare function isValidCornellType(type: string): type is CornellType;
