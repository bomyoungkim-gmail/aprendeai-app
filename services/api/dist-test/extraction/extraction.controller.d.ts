import { ExtractionService } from "./extraction.service";
export declare class ExtractionController {
    private extractionService;
    constructor(extractionService: ExtractionService);
    requestExtraction(contentId: string, req: any): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        content_id: string;
        status: import(".prisma/client").$Enums.ExtractionStatus;
        extracted_text_ref: string | null;
        metadata_json: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    getStatus(contentId: string): Promise<{
        contents: {
            type: import(".prisma/client").$Enums.ContentType;
            title: string;
        };
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        content_id: string;
        status: import(".prisma/client").$Enums.ExtractionStatus;
        extracted_text_ref: string | null;
        metadata_json: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    getChunks(contentId: string, page?: string, range?: string): Promise<{
        id: string;
        created_at: Date;
        text: string;
        content_id: string;
        chunk_index: number;
        page_number: number | null;
        token_estimate: number | null;
    }[]>;
}
