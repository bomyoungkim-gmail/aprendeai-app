"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateContentUseCase = void 0;
const common_1 = require("@nestjs/common");
const content_repository_interface_1 = require("../../domain/content.repository.interface");
const storage_service_1 = require("../../services/storage.service");
const video_service_1 = require("../../../video/video.service");
const uuid_1 = require("uuid");
const path = require("path");
let CreateContentUseCase = class CreateContentUseCase {
    constructor(contentRepository, storageService, videoService) {
        this.contentRepository = contentRepository;
        this.storageService = storageService;
        this.videoService = videoService;
    }
    async execute(file, dto, userId) {
        const isVideo = this.videoService.isVideoFile(file.mimetype);
        const isAudio = this.videoService.isAudioFile(file.mimetype);
        const storageKey = await this.storageService.saveFile(file);
        const filePath = path.join("./uploads", storageKey);
        let rawText = "";
        let duration;
        let thumbnailUrl;
        if (isVideo || isAudio) {
            if (isVideo) {
                const metadata = await this.videoService.extractVideoMetadata(filePath);
                duration = metadata.duration;
                try {
                    const thumbnailPath = await this.videoService.generateThumbnail(filePath);
                    thumbnailUrl = `/uploads/thumbnails/${path.basename(thumbnailPath)}`;
                }
                catch (e) {
                }
            }
            rawText = "(Transcription Pending)";
        }
        else {
            rawText = "Extracted Text Placeholder";
        }
        let ownerType = "USER";
        let ownerId = userId;
        if (dto.scopeType === "FAMILY" || dto.scopeType === "INSTITUTION") {
            ownerType = dto.scopeType;
            ownerId = dto.scopeId || userId;
        }
        const content = await this.contentRepository.create({
            id: (0, uuid_1.v4)(),
            title: dto.title,
            type: this.getContentType(file.mimetype),
            originalLanguage: dto.originalLanguage,
            rawText,
            ownerType,
            ownerId,
            scopeType: dto.scopeType,
            scopeId: dto.scopeId,
            metadata: {
                duration,
                thumbnailUrl,
                storageKey
            }
        });
        return content;
    }
    getContentType(mimeType) {
        if (mimeType === "application/pdf")
            return "PDF";
        if (mimeType.includes("wordprocessing"))
            return "DOCX";
        if (mimeType.startsWith("video/"))
            return "VIDEO";
        if (mimeType.startsWith("audio/"))
            return "AUDIO";
        return "PDF";
    }
};
exports.CreateContentUseCase = CreateContentUseCase;
exports.CreateContentUseCase = CreateContentUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(content_repository_interface_1.IContentRepository)),
    __metadata("design:paramtypes", [Object, storage_service_1.StorageService,
        video_service_1.VideoService])
], CreateContentUseCase);
//# sourceMappingURL=create-content.use-case.js.map