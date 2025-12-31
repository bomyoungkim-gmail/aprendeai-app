import { Language, ScopeType } from "@prisma/client";
export declare class UploadContentDto {
    title: string;
    originalLanguage: Language;
    scopeType?: ScopeType;
    scopeId?: string;
}
