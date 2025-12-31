import { PrismaService } from '../../../prisma/prisma.service';
import { ISearchRepository, SearchResult } from '../../domain/interfaces/search.repository.interface';
export declare class PrismaSearchRepository implements ISearchRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    searchContent(query: string, filters: any): Promise<SearchResult[]>;
    searchTranscripts(query: string): Promise<SearchResult[]>;
    searchAnnotations(userId: string, query: string): Promise<SearchResult[]>;
    searchNotes(userId: string, query: string): Promise<SearchResult[]>;
    private extractSnippet;
    private calculateRelevance;
}
