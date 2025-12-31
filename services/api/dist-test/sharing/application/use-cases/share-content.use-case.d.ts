import { ISharingRepository } from '../../domain/interfaces/sharing.repository.interface';
import { ContentShare, ShareContextType, SharePermission } from '../../domain/entities/content-share.entity';
import { PermissionEvaluator } from '../../../auth/domain/permission.evaluator';
export declare class ShareContentUseCase {
    private readonly sharingRepo;
    private readonly permissions;
    constructor(sharingRepo: ISharingRepository, permissions: PermissionEvaluator);
    execute(userId: string, contentId: string, dto: {
        contextType: ShareContextType;
        contextId: string;
        permission: SharePermission;
    }): Promise<ContentShare>;
}
