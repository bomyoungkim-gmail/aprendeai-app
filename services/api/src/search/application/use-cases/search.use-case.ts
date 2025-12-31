import { Injectable, Inject } from '@nestjs/common';
import { ISearchRepository, SearchResult } from '../../domain/interfaces/search.repository.interface';
import { SearchDto } from '../../dto/search.dto';

@Injectable()
export class SearchUseCase {
  constructor(
    @Inject(ISearchRepository)
    private readonly searchRepo: ISearchRepository,
  ) {}

  async execute(userId: string, dto: SearchDto): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    const searchPromises = [];

    if (!dto.searchIn || dto.searchIn === 'content') {
      searchPromises.push(this.searchRepo.searchContent(dto.query, dto));
    }

    if (!dto.searchIn || dto.searchIn === 'annotation') {
      searchPromises.push(this.searchRepo.searchAnnotations(userId, dto.query));
    }

    if (!dto.searchIn || dto.searchIn === 'note') {
      searchPromises.push(this.searchRepo.searchNotes(userId, dto.query));
    }

    if (!dto.searchIn || dto.searchIn === 'transcript') {
      searchPromises.push(this.searchRepo.searchTranscripts(dto.query));
    }

    const resolvedResults = await Promise.all(searchPromises);
    resolvedResults.forEach((batch) => results.push(...batch));

    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);

    // Apply pagination
    const { offset = 0, limit = 20 } = dto;
    return results.slice(offset, offset + limit);
  }
}
