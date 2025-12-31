import { PrismaService } from '../../../prisma/prisma.service';
import { ISharingRepository } from '../../domain/interfaces/sharing.repository.interface';
import { ContentShare } from '../../domain/entities/content-share.entity';
import { AnnotationShare } from '../../domain/entities/annotation-share.entity';
export declare class PrismaSharingRepository implements ISharingRepository {
    private prisma;
    constructor(prisma: PrismaService);
    upsertContentShare(share: ContentShare): Promise<ContentShare>;
    revokeContentShare(contentId: string, contextType: string, contextId: string): Promise<void>;
    upsertAnnotationShare(share: AnnotationShare): Promise<AnnotationShare>;
    revokeAnnotationShare(annotationId: string, contextType: string, contextId: string): Promise<void>;
}
