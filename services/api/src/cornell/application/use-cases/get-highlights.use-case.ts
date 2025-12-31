import { Injectable, Inject } from "@nestjs/common";
import { IHighlightsRepository } from "../../domain/interfaces/highlights.repository.interface";
import { Highlight } from "../../domain/entities/highlight.entity";

@Injectable()
export class GetHighlightsUseCase {
  constructor(
    @Inject(IHighlightsRepository)
    private readonly highlightsRepository: IHighlightsRepository,
  ) {}

  async execute(contentId: string, userId: string): Promise<Highlight[]> {
    return this.highlightsRepository.findAllByContent(contentId, userId);
  }
}
