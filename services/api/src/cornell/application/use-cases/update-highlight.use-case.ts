import { Injectable, Inject, ForbiddenException } from "@nestjs/common";
import { IHighlightsRepository } from "../../domain/interfaces/highlights.repository.interface";
import { UpdateHighlightDto } from "../../dto/cornell.dto";
import { Highlight } from "../../domain/entities/highlight.entity";

@Injectable()
export class UpdateHighlightUseCase {
  constructor(
    @Inject(IHighlightsRepository)
    private readonly highlightsRepository: IHighlightsRepository,
  ) {}

  async execute(
    id: string,
    dto: UpdateHighlightDto,
    userId: string,
  ): Promise<Highlight> {
    const highlight = await this.highlightsRepository.findById(id);
    if (!highlight || highlight.userId !== userId) {
      throw new ForbiddenException();
    }

    highlight.colorKey = dto.color_key ?? highlight.colorKey;
    highlight.commentText = dto.comment_text ?? highlight.commentText;
    highlight.tags = dto.tags_json ?? highlight.tags;
    highlight.type = dto.type ?? highlight.type;

    return this.highlightsRepository.update(highlight);
  }
}
