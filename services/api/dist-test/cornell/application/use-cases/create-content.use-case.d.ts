import { IContentRepository } from "../../domain/content.repository.interface";
import { Content } from "../../domain/content.entity";
import { StorageService } from "../../services/storage.service";
import { VideoService } from "../../../video/video.service";
import { UploadContentDto } from "../../dto/upload-content.dto";
export declare class CreateContentUseCase {
    private readonly contentRepository;
    private readonly storageService;
    private readonly videoService;
    constructor(contentRepository: IContentRepository, storageService: StorageService, videoService: VideoService);
    execute(file: Express.Multer.File, dto: UploadContentDto, userId: string): Promise<Content>;
    private getContentType;
}
