import { Injectable } from "@nestjs/common";
import { SearchDto } from "./dto/search.dto";
import { SearchUseCase } from "./application/use-cases/search.use-case";

export { SearchResult } from "./domain/interfaces/search.repository.interface";

@Injectable()
export class SearchService {
  constructor(private readonly searchUseCase: SearchUseCase) {}

  /**
   * Unified search across all content types
   */
  async search(userId: string, dto: SearchDto) {
    return this.searchUseCase.execute(userId, dto);
  }
}
