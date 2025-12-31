import { IContentRepository } from "../../domain/content.repository.interface";
import { Content } from "../../domain/content.entity";
import { ContentAccessService } from "../../services/content-access.service";
export declare class GetContentUseCase {
    private readonly contentRepository;
    private readonly contentAccessService;
    constructor(contentRepository: IContentRepository, contentAccessService: ContentAccessService);
    execute(contentId: string, userId: string): Promise<Content>;
}
