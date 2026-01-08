import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { ScopeType } from "@prisma/client";
import { IContentRepository } from "../../domain/content.repository.interface";
import { ContentAccessService } from "../../services/content-access.service";

@Injectable()
export class DeleteContentUseCase {
  constructor(
    @Inject(IContentRepository)
    private readonly contentRepository: IContentRepository,
    private readonly contentAccessService: ContentAccessService,
  ) {}

  async execute(contentId: string, userId: string): Promise<void> {
    const content = await this.contentRepository.findById(contentId);
    if (!content) throw new NotFoundException("Content not found");

    // Check Delete Access (Strict Owner)
    if (content.scopeType === ScopeType.USER && content.scopeId !== userId) {
      throw new ForbiddenException("Only owner can delete content");
    }

    await this.contentRepository.delete(contentId);
  }
}
