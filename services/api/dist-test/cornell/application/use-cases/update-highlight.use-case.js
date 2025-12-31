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
exports.UpdateHighlightUseCase = void 0;
const common_1 = require("@nestjs/common");
const highlights_repository_interface_1 = require("../../domain/interfaces/highlights.repository.interface");
let UpdateHighlightUseCase = class UpdateHighlightUseCase {
    constructor(highlightsRepository) {
        this.highlightsRepository = highlightsRepository;
    }
    async execute(id, dto, userId) {
        var _a, _b, _c;
        const highlight = await this.highlightsRepository.findById(id);
        if (!highlight || highlight.userId !== userId) {
            throw new common_1.ForbiddenException();
        }
        highlight.colorKey = (_a = dto.color_key) !== null && _a !== void 0 ? _a : highlight.colorKey;
        highlight.commentText = (_b = dto.comment_text) !== null && _b !== void 0 ? _b : highlight.commentText;
        highlight.tags = (_c = dto.tags_json) !== null && _c !== void 0 ? _c : highlight.tags;
        return this.highlightsRepository.update(highlight);
    }
};
exports.UpdateHighlightUseCase = UpdateHighlightUseCase;
exports.UpdateHighlightUseCase = UpdateHighlightUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(highlights_repository_interface_1.IHighlightsRepository)),
    __metadata("design:paramtypes", [Object])
], UpdateHighlightUseCase);
//# sourceMappingURL=update-highlight.use-case.js.map