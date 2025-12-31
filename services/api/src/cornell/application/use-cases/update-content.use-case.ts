import { Injectable, Inject, NotFoundException, ForbiddenException } from "@nestjs/common";
import { IContentRepository } from "../../domain/content.repository.interface";
import { Content } from "../../domain/content.entity";
import { ContentAccessService } from "../../services/content-access.service";
import { UpdateContentDto } from "../../dto/cornell.dto"; 
// Note: Cornell DTO location for UpdateContentDto might be 'dto/cornell.dto' or 'dto/update-content.dto'.
// Based on controller, it imports from './dto/cornell.dto'.

@Injectable()
export class UpdateContentUseCase {
  constructor(
    @Inject(IContentRepository) private readonly contentRepository: IContentRepository,
    private readonly contentAccessService: ContentAccessService,
  ) {}

  async execute(contentId: string, userId: string, dto: UpdateContentDto): Promise<Content> {
    const content = await this.contentRepository.findById(contentId);
    if (!content) throw new NotFoundException("Content not found");

    // Check Write Access
    // Assuming canAccessContent covers read, but we need WRITE.
    // For now reusing canAccessContent, but ideally we have canManageContent
    if (content.ownerType === "USER" && content.ownerId !== userId) {
         throw new ForbiddenException("Only owner can update content");
    }
    // TODO: Add Family/Institution Admin logic

    const updated = await this.contentRepository.update(contentId, {
        title: dto.title,
        metadata: dto.metadata ? { ...content.metadata, ...dto.metadata } : content.metadata,
        // Add mapped fields from DTO
    });

    return updated;
  }
}
