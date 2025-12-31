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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaContentRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const content_entity_1 = require("../../domain/content.entity");
let PrismaContentRepository = class PrismaContentRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        var _a;
        const created = await this.prisma.contents.create({
            data: {
                id: data.id,
                title: data.title,
                type: data.type,
                original_language: data.originalLanguage,
                raw_text: data.rawText,
                owner_type: data.ownerType,
                owner_id: data.ownerId,
                scope_type: data.scopeType,
                scope_id: data.scopeId,
                metadata: data.metadata || {},
                updated_at: new Date(),
                source_url: (_a = data.metadata) === null || _a === void 0 ? void 0 : _a.source_url
            },
        });
        return this.mapToDomain(created);
    }
    async findById(id) {
        const found = await this.prisma.contents.findUnique({
            where: { id },
            include: { files: true }
        });
        return found ? this.mapToDomain(found) : null;
    }
    async update(id, data) {
        const updated = await this.prisma.contents.update({
            where: { id },
            data: {
                title: data.title,
                metadata: data.metadata,
            },
        });
        return this.mapToDomain(updated);
    }
    async findMany(params) {
        const found = await this.prisma.contents.findMany({
            where: params.where,
            skip: params.skip,
            take: params.take,
            orderBy: params.orderBy,
        });
        return found.map(this.mapToDomain);
    }
    async count(params) {
        return this.prisma.contents.count({ where: params.where });
    }
    async delete(id) {
        await this.prisma.contents.delete({ where: { id } });
    }
    async addVersion(version) {
        const created = await this.prisma.content_versions.create({
            data: {
                id: version.id,
                content_id: version.contentId,
                target_language: version.targetLanguage,
                schooling_level_target: version.schoolingLevelTarget,
                simplified_text: version.simplifiedText,
                summary: version.summary
            }
        });
        return new content_entity_1.ContentVersion({
            id: created.id,
            contentId: created.content_id,
            targetLanguage: created.target_language,
            schoolingLevelTarget: created.schooling_level_target,
            simplifiedText: created.simplified_text,
            summary: created.summary,
            createdAt: created.created_at
        });
    }
    mapToDomain(prismaContent) {
        return new content_entity_1.Content({
            id: prismaContent.id,
            title: prismaContent.title,
            type: prismaContent.type,
            originalLanguage: prismaContent.original_language,
            rawText: prismaContent.raw_text,
            ownerType: prismaContent.owner_type,
            ownerId: prismaContent.owner_id,
            scopeType: prismaContent.scope_type,
            scopeId: prismaContent.scope_id,
            metadata: prismaContent.metadata,
            file: prismaContent.files ? {
                id: prismaContent.files.id,
                originalFilename: prismaContent.files.originalFilename,
                mimeType: prismaContent.files.mimeType,
                sizeBytes: Number(prismaContent.files.sizeBytes),
            } : undefined,
            createdAt: prismaContent.created_at,
            updatedAt: prismaContent.updated_at,
        });
    }
};
exports.PrismaContentRepository = PrismaContentRepository;
exports.PrismaContentRepository = PrismaContentRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaContentRepository);
//# sourceMappingURL=prisma-content.repository.js.map