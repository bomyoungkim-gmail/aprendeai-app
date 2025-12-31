import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ISharingRepository } from '../../domain/interfaces/sharing.repository.interface';
import { ContentShare, ShareContextType, SharePermission } from '../../domain/entities/content-share.entity';
import { AnnotationShare, AnnotationShareMode } from '../../domain/entities/annotation-share.entity';

@Injectable()
export class PrismaSharingRepository implements ISharingRepository {
  constructor(private prisma: PrismaService) {}

  async upsertContentShare(share: ContentShare): Promise<ContentShare> {
    const upserted = await this.prisma.content_shares.upsert({
      where: {
        content_id_context_type_context_id: {
          content_id: share.contentId,
          context_type: share.contextType as any,
          context_id: share.contextId,
        },
      },
      update: {
        permission: share.permission as any,
      },
      create: {
        content_id: share.contentId,
        context_type: share.contextType as any,
        context_id: share.contextId,
        permission: share.permission as any,
        created_by: share.createdBy,
      },
    });

    return new ContentShare(
      upserted.content_id,
      upserted.context_type as ShareContextType,
      upserted.context_id,
      upserted.permission as SharePermission,
      upserted.created_by,
      upserted.created_at,
    );
  }

  async revokeContentShare(contentId: string, contextType: string, contextId: string): Promise<void> {
    await this.prisma.content_shares.deleteMany({
      where: {
        content_id: contentId,
        context_type: contextType as any,
        context_id: contextId,
      },
    });
  }

  async upsertAnnotationShare(share: AnnotationShare): Promise<AnnotationShare> {
    const upserted = await this.prisma.annotation_shares.upsert({
      where: {
        annotation_id_context_type_context_id: {
          annotation_id: share.annotationId,
          context_type: share.contextType as any,
          context_id: share.contextId,
        },
      },
      update: {
        mode: share.mode as any,
      },
      create: {
        annotation_id: share.annotationId,
        context_type: share.contextType as any,
        context_id: share.contextId,
        mode: share.mode as any,
        created_by: share.createdBy,
      },
    });

    return new AnnotationShare(
      upserted.annotation_id,
      upserted.context_type as ShareContextType,
      upserted.context_id,
      upserted.mode as AnnotationShareMode,
      upserted.created_by,
      upserted.created_at,
    );
  }

  async revokeAnnotationShare(annotationId: string, contextType: string, contextId: string): Promise<void> {
    await this.prisma.annotation_shares.deleteMany({
      where: {
        annotation_id: annotationId,
        context_type: contextType as any,
        context_id: contextId,
      },
    });
  }
}
