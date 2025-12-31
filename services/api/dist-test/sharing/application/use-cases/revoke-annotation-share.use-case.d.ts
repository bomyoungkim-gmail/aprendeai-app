import { ISharingRepository } from '../../domain/interfaces/sharing.repository.interface';
export declare class RevokeAnnotationShareUseCase {
    private readonly sharingRepo;
    constructor(sharingRepo: ISharingRepository);
    execute(annotationId: string, contextType: string, contextId: string): Promise<void>;
}
