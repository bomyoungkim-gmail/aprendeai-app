import { ContentShare } from '../entities/content-share.entity';
import { AnnotationShare } from '../entities/annotation-share.entity';
export interface ISharingRepository {
    upsertContentShare(share: ContentShare): Promise<ContentShare>;
    revokeContentShare(contentId: string, contextType: string, contextId: string): Promise<void>;
    upsertAnnotationShare(share: AnnotationShare): Promise<AnnotationShare>;
    revokeAnnotationShare(annotationId: string, contextType: string, contextId: string): Promise<void>;
}
export declare const ISharingRepository: unique symbol;
