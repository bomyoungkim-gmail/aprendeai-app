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
exports.DeleteHighlightUseCase = void 0;
const common_1 = require("@nestjs/common");
const highlights_repository_interface_1 = require("../../domain/interfaces/highlights.repository.interface");
let DeleteHighlightUseCase = class DeleteHighlightUseCase {
    constructor(highlightsRepository) {
        this.highlightsRepository = highlightsRepository;
    }
    async execute(id, userId) {
        const highlight = await this.highlightsRepository.findById(id);
        if (!highlight || highlight.userId !== userId) {
            throw new common_1.ForbiddenException();
        }
        await this.highlightsRepository.delete(id);
    }
};
exports.DeleteHighlightUseCase = DeleteHighlightUseCase;
exports.DeleteHighlightUseCase = DeleteHighlightUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(highlights_repository_interface_1.IHighlightsRepository)),
    __metadata("design:paramtypes", [Object])
], DeleteHighlightUseCase);
//# sourceMappingURL=delete-highlight.use-case.js.map