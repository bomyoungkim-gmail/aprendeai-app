import { Injectable } from "@nestjs/common";
import {
  ShareContentRequest,
  ShareAnnotationRequest,
  ShareContextType,
} from "./dto/sharing.dto";
import { ShareContentUseCase } from "./application/use-cases/share-content.use-case";
import { RevokeContentShareUseCase } from "./application/use-cases/revoke-content-share.use-case";
import { ShareAnnotationUseCase } from "./application/use-cases/share-annotation.use-case";
import { RevokeAnnotationShareUseCase } from "./application/use-cases/revoke-annotation-share.use-case";
import {
  ShareContextType as DomainShareContextType,
  SharePermission,
} from "./domain/entities/content-share.entity";
import { AnnotationShareMode } from "./domain/entities/annotation-share.entity";

@Injectable()
export class SharingService {
  constructor(
    private readonly shareContentUseCase: ShareContentUseCase,
    private readonly revokeContentUseCase: RevokeContentShareUseCase,
    private readonly shareAnnotationUseCase: ShareAnnotationUseCase,
    private readonly revokeAnnotationUseCase: RevokeAnnotationShareUseCase,
  ) {}

  /**
   * Share content with a context
   */
  async shareContent(
    userId: string,
    contentId: string,
    dto: ShareContentRequest,
  ) {
    return this.shareContentUseCase.execute(userId, contentId, {
      contextType: dto.contextType as unknown as DomainShareContextType,
      contextId: dto.contextId,
      permission: dto.permission as unknown as SharePermission,
    });
  }

  /**
   * Revoke content share
   */
  async revokeContentShare(
    userId: string,
    contentId: string,
    contextType: ShareContextType,
    contextId: string,
  ) {
    return this.revokeContentUseCase.execute(contentId, contextType, contextId);
  }

  /**
   * Share annotation
   */
  async shareAnnotation(
    userId: string,
    annotationId: string,
    dto: ShareAnnotationRequest,
  ) {
    return this.shareAnnotationUseCase.execute(userId, annotationId, {
      contextType: dto.contextType as unknown as DomainShareContextType,
      contextId: dto.contextId,
      mode: dto.mode as unknown as AnnotationShareMode,
    });
  }

  /**
   * Revoke annotation share
   */
  async revokeAnnotationShare(
    userId: string,
    annotationId: string,
    contextType: ShareContextType,
    contextId: string,
  ) {
    return this.revokeAnnotationUseCase.execute(
      annotationId,
      contextType,
      contextId,
    );
  }
}
