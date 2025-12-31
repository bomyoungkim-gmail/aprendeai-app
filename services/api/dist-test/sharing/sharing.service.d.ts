import { ShareContentRequest, ShareAnnotationRequest, ShareContextType } from "./dto/sharing.dto";
import { ShareContentUseCase } from "./application/use-cases/share-content.use-case";
import { RevokeContentShareUseCase } from "./application/use-cases/revoke-content-share.use-case";
import { ShareAnnotationUseCase } from "./application/use-cases/share-annotation.use-case";
import { RevokeAnnotationShareUseCase } from "./application/use-cases/revoke-annotation-share.use-case";
export declare class SharingService {
    private readonly shareContentUseCase;
    private readonly revokeContentUseCase;
    private readonly shareAnnotationUseCase;
    private readonly revokeAnnotationUseCase;
    constructor(shareContentUseCase: ShareContentUseCase, revokeContentUseCase: RevokeContentShareUseCase, shareAnnotationUseCase: ShareAnnotationUseCase, revokeAnnotationUseCase: RevokeAnnotationShareUseCase);
    shareContent(userId: string, contentId: string, dto: ShareContentRequest): Promise<import("./domain/entities/content-share.entity").ContentShare>;
    revokeContentShare(userId: string, contentId: string, contextType: ShareContextType, contextId: string): Promise<void>;
    shareAnnotation(userId: string, annotationId: string, dto: ShareAnnotationRequest): Promise<import("./domain/entities/annotation-share.entity").AnnotationShare>;
    revokeAnnotationShare(userId: string, annotationId: string, contextType: ShareContextType, contextId: string): Promise<void>;
}
