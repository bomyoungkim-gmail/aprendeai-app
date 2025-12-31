import { ISearchRepository, SearchResult } from '../../domain/interfaces/search.repository.interface';
import { SearchDto } from '../../dto/search.dto';
export declare class SearchUseCase {
    private readonly searchRepo;
    constructor(searchRepo: ISearchRepository);
    execute(userId: string, dto: SearchDto): Promise<SearchResult[]>;
}
