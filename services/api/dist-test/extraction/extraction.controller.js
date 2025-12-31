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
exports.ExtractionController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const extraction_service_1 = require("./extraction.service");
let ExtractionController = class ExtractionController {
    constructor(extractionService) {
        this.extractionService = extractionService;
    }
    async requestExtraction(contentId, req) {
        return this.extractionService.requestExtraction(contentId, req.user.id);
    }
    async getStatus(contentId) {
        return this.extractionService.getExtractionStatus(contentId);
    }
    async getChunks(contentId, page, range) {
        const pageNum = page ? parseInt(page, 10) : undefined;
        return this.extractionService.getChunks(contentId, pageNum, range);
    }
};
exports.ExtractionController = ExtractionController;
__decorate([
    (0, common_1.Post)(":id/extract"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ExtractionController.prototype, "requestExtraction", null);
__decorate([
    (0, common_1.Get)(":id/extract/status"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ExtractionController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)(":id/chunks"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Query)("page")),
    __param(2, (0, common_1.Query)("range")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ExtractionController.prototype, "getChunks", null);
exports.ExtractionController = ExtractionController = __decorate([
    (0, common_1.Controller)("contents"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt")),
    __metadata("design:paramtypes", [extraction_service_1.ExtractionService])
], ExtractionController);
//# sourceMappingURL=extraction.controller.js.map