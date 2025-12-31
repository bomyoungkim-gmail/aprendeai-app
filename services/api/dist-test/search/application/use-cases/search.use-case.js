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
exports.SearchUseCase = void 0;
const common_1 = require("@nestjs/common");
const search_repository_interface_1 = require("../../domain/interfaces/search.repository.interface");
let SearchUseCase = class SearchUseCase {
    constructor(searchRepo) {
        this.searchRepo = searchRepo;
    }
    async execute(userId, dto) {
        const results = [];
        const searchPromises = [];
        if (!dto.searchIn || dto.searchIn === 'content') {
            searchPromises.push(this.searchRepo.searchContent(dto.query, dto));
        }
        if (!dto.searchIn || dto.searchIn === 'annotation') {
            searchPromises.push(this.searchRepo.searchAnnotations(userId, dto.query));
        }
        if (!dto.searchIn || dto.searchIn === 'note') {
            searchPromises.push(this.searchRepo.searchNotes(userId, dto.query));
        }
        if (!dto.searchIn || dto.searchIn === 'transcript') {
            searchPromises.push(this.searchRepo.searchTranscripts(dto.query));
        }
        const resolvedResults = await Promise.all(searchPromises);
        resolvedResults.forEach((batch) => results.push(...batch));
        results.sort((a, b) => b.relevance - a.relevance);
        const { offset = 0, limit = 20 } = dto;
        return results.slice(offset, offset + limit);
    }
};
exports.SearchUseCase = SearchUseCase;
exports.SearchUseCase = SearchUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(search_repository_interface_1.ISearchRepository)),
    __metadata("design:paramtypes", [Object])
], SearchUseCase);
//# sourceMappingURL=search.use-case.js.map