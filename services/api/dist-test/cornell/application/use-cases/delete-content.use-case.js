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
exports.DeleteContentUseCase = void 0;
const common_1 = require("@nestjs/common");
const content_repository_interface_1 = require("../../domain/content.repository.interface");
const content_access_service_1 = require("../../services/content-access.service");
let DeleteContentUseCase = class DeleteContentUseCase {
    constructor(contentRepository, contentAccessService) {
        this.contentRepository = contentRepository;
        this.contentAccessService = contentAccessService;
    }
    async execute(contentId, userId) {
        const content = await this.contentRepository.findById(contentId);
        if (!content)
            throw new common_1.NotFoundException("Content not found");
        if (content.ownerType === "USER" && content.ownerId !== userId) {
            throw new common_1.ForbiddenException("Only owner can delete content");
        }
        await this.contentRepository.delete(contentId);
    }
};
exports.DeleteContentUseCase = DeleteContentUseCase;
exports.DeleteContentUseCase = DeleteContentUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(content_repository_interface_1.IContentRepository)),
    __metadata("design:paramtypes", [Object, content_access_service_1.ContentAccessService])
], DeleteContentUseCase);
//# sourceMappingURL=delete-content.use-case.js.map