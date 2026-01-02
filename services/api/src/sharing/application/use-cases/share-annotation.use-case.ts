import { Injectable, Inject } from "@nestjs/common";
import { ISharingRepository } from "../../domain/interfaces/sharing.repository.interface";
import {
  AnnotationShare,
  AnnotationShareMode,
} from "../../domain/entities/annotation-share.entity";
import { ShareContextType } from "../../domain/entities/content-share.entity";

@Injectable()
export class ShareAnnotationUseCase {
  constructor(
    @Inject(ISharingRepository)
    private readonly sharingRepo: ISharingRepository,
  ) {}

  async execute(
    userId: string,
    annotationId: string,
    dto: {
      contextType: ShareContextType;
      contextId: string;
      mode: AnnotationShareMode;
    },
  ): Promise<AnnotationShare> {
    const share = new AnnotationShare(
      annotationId,
      dto.contextType,
      dto.contextId,
      dto.mode,
      userId,
      new Date(),
    );

    return this.sharingRepo.upsertAnnotationShare(share);
  }
}
