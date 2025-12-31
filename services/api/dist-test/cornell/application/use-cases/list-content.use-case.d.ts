import { IContentRepository } from "../../domain/content.repository.interface";
import { Content } from "../../domain/content.entity";
import { ContentType, Language } from "@prisma/client";
export interface ListContentFilters {
    type?: ContentType;
    language?: Language;
    page?: number;
    limit?: number;
    query?: string;
}
export declare class ListContentUseCase {
    private readonly contentRepository;
    constructor(contentRepository: IContentRepository);
    execute(userId: string, filters: ListContentFilters): Promise<{
        results: Content[];
        total: number;
    }>;
}
