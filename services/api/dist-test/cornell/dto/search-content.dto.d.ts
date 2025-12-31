import { ContentType, Language } from "@prisma/client";
export declare class SearchContentDto {
    q: string;
    type?: ContentType;
    language?: Language;
    page?: number;
    limit?: number;
}
