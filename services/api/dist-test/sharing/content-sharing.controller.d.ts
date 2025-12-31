import { SharingService } from "./sharing.service";
import { ShareContentRequest, ShareContextType } from "./dto/sharing.dto";
export declare class ContentSharingController {
    private readonly sharingService;
    constructor(sharingService: SharingService);
    share(contentId: string, dto: ShareContentRequest, req: any): Promise<import("./domain/entities/content-share.entity").ContentShare>;
    revoke(contentId: string, contextType: ShareContextType, contextId: string, req: any): Promise<void>;
}
