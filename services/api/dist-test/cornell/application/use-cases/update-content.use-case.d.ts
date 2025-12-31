import { IContentRepository } from "../../domain/content.repository.interface";
import { Content } from "../../domain/content.entity";
import { ContentAccessService } from "../../services/content-access.service";
import { UpdateContentDto } from "../../dto/cornell.dto";
export declare class UpdateContentUseCase {
    private readonly contentRepository;
    private readonly contentAccessService;
    constructor(contentRepository: IContentRepository, contentAccessService: ContentAccessService);
    execute(contentId: string, userId: string, dto: UpdateContentDto): Promise<Content>;
}
