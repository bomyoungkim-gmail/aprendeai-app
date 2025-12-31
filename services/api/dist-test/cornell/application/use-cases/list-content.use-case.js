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
exports.ListContentUseCase = void 0;
const common_1 = require("@nestjs/common");
const content_repository_interface_1 = require("../../domain/content.repository.interface");
let ListContentUseCase = class ListContentUseCase {
    constructor(contentRepository) {
        this.contentRepository = contentRepository;
    }
    async execute(userId, filters) {
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;
        const where = {
            OR: [
                { owner_id: userId },
                { created_by: userId }
            ]
        };
        if (filters.type)
            where.type = filters.type;
        if (filters.language)
            where.original_language = filters.language;
        if (filters.query) {
            where.OR = [
                { title: { contains: filters.query, mode: 'insensitive' } },
                { raw_text: { contains: filters.query, mode: 'insensitive' } }
            ];
        }
        const [results, total] = await Promise.all([
            this.contentRepository.findMany({ where, skip, take: limit, orderBy: { created_at: 'desc' } }),
            this.contentRepository.count({ where })
        ]);
        return { results, total };
    }
};
exports.ListContentUseCase = ListContentUseCase;
exports.ListContentUseCase = ListContentUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(content_repository_interface_1.IContentRepository)),
    __metadata("design:paramtypes", [Object])
], ListContentUseCase);
//# sourceMappingURL=list-content.use-case.js.map