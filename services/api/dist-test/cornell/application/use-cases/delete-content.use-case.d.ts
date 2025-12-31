import { IContentRepository } from "../../domain/content.repository.interface";
import { ContentAccessService } from "../../services/content-access.service";
export declare class DeleteContentUseCase {
    private readonly contentRepository;
    private readonly contentAccessService;
    constructor(contentRepository: IContentRepository, contentAccessService: ContentAccessService);
    execute(contentId: string, userId: string): Promise<void>;
}
