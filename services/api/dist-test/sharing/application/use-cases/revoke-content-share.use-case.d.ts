import { ISharingRepository } from '../../domain/interfaces/sharing.repository.interface';
export declare class RevokeContentShareUseCase {
    private readonly sharingRepo;
    constructor(sharingRepo: ISharingRepository);
    execute(contentId: string, contextType: string, contextId: string): Promise<void>;
}
