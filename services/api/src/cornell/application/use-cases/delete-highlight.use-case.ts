import { Injectable, Inject, ForbiddenException } from "@nestjs/common";
import { IHighlightsRepository } from "../../domain/interfaces/highlights.repository.interface";

@Injectable()
export class DeleteHighlightUseCase {
  constructor(
    @Inject(IHighlightsRepository)
    private readonly highlightsRepository: IHighlightsRepository,
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    const highlight = await this.highlightsRepository.findById(id);
    if (!highlight || highlight.userId !== userId) {
      throw new ForbiddenException();
    }

    await this.highlightsRepository.delete(id);
  }
}
