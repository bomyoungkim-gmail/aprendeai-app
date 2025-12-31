import { Injectable, Inject, NotFoundException, ForbiddenException } from "@nestjs/common";
import { IContentRepository } from "../../domain/content.repository.interface";
import { Content } from "../../domain/content.entity";
import { ContentAccessService } from "../../services/content-access.service";

@Injectable()
export class GetContentUseCase {
  constructor(
    @Inject(IContentRepository) private readonly contentRepository: IContentRepository,
    private readonly contentAccessService: ContentAccessService,
  ) {}

  async execute(contentId: string, userId: string): Promise<Content> {
    const content = await this.contentRepository.findById(contentId);
    
    if (!content) {
      throw new NotFoundException("Content not found");
    }

    // Access Check logic using Domain Service
    const hasAccess = await this.contentAccessService.canAccessContent(contentId, userId);
    
    if (!hasAccess) {
        throw new ForbiddenException("Access denied");
    }

    return content;
  }
}
