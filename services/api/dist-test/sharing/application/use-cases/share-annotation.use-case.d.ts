import { ISharingRepository } from '../../domain/interfaces/sharing.repository.interface';
import { AnnotationShare, AnnotationShareMode } from '../../domain/entities/annotation-share.entity';
import { ShareContextType } from '../../domain/entities/content-share.entity';
export declare class ShareAnnotationUseCase {
    private readonly sharingRepo;
    constructor(sharingRepo: ISharingRepository);
    execute(userId: string, annotationId: string, dto: {
        contextType: ShareContextType;
        contextId: string;
        mode: AnnotationShareMode;
    }): Promise<AnnotationShare>;
}
