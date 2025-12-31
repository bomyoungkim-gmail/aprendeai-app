import { ContentType, Language } from "@prisma/client";
export declare class SearchDto {
    query: string;
    contentType?: ContentType;
    language?: Language;
    ownerId?: string;
    startDate?: string;
    endDate?: string;
    searchIn?: "content" | "annotation" | "note" | "transcript";
    limit?: number;
    offset?: number;
}
