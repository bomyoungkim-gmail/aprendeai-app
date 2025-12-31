import { SearchService } from "./search.service";
import { SearchDto } from "./dto/search.dto";
export declare class SearchController {
    private readonly searchService;
    constructor(searchService: SearchService);
    search(userId: string, dto: SearchDto): Promise<import("./search.service").SearchResult[]>;
}
