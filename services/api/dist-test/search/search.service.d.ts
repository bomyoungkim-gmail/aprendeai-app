import { SearchDto } from "./dto/search.dto";
import { SearchUseCase } from "./application/use-cases/search.use-case";
export { SearchResult } from "./domain/interfaces/search.repository.interface";
export declare class SearchService {
    private readonly searchUseCase;
    constructor(searchUseCase: SearchUseCase);
    search(userId: string, dto: SearchDto): Promise<import("./domain/interfaces/search.repository.interface").SearchResult[]>;
}
