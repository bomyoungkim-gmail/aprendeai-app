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
exports.PrismaHighlightsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const highlight_entity_1 = require("../../domain/entities/highlight.entity");
let PrismaHighlightsRepository = class PrismaHighlightsRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAllByContent(contentId, userId) {
        const found = await this.prisma.highlights.findMany({
            where: { content_id: contentId, user_id: userId },
            orderBy: { created_at: "asc" },
        });
        return found.map((h) => this.mapToDomain(h));
    }
    async findById(id) {
        const found = await this.prisma.highlights.findUnique({
            where: { id },
        });
        return found ? this.mapToDomain(found) : null;
    }
    async create(highlight) {
        const created = await this.prisma.highlights.create({
            data: {
                id: highlight.id,
                content_id: highlight.contentId,
                user_id: highlight.userId,
                kind: highlight.kind,
                target_type: highlight.targetType,
                page_number: highlight.pageNumber,
                anchor_json: highlight.anchor,
                color_key: highlight.colorKey,
                comment_text: highlight.commentText,
                tags_json: highlight.tags || [],
                timestamp_ms: highlight.timestampMs,
                duration_ms: highlight.durationMs,
                visibility: highlight.visibility,
                visibility_scope: highlight.visibilityScope,
                context_type: highlight.contextType,
                context_id: highlight.contextId,
                learner_id: highlight.learnerId,
                status: highlight.status || "ACTIVE",
            },
        });
        return this.mapToDomain(created);
    }
    async update(highlight) {
        const updated = await this.prisma.highlights.update({
            where: { id: highlight.id },
            data: {
                color_key: highlight.colorKey,
                comment_text: highlight.commentText,
                tags_json: highlight.tags,
                visibility: highlight.visibility,
                visibility_scope: highlight.visibilityScope,
                context_type: highlight.contextType,
                context_id: highlight.contextId,
                learner_id: highlight.learnerId,
                status: highlight.status,
                updated_at: new Date(),
            },
        });
        return this.mapToDomain(updated);
    }
    async delete(id) {
        await this.prisma.highlights.delete({ where: { id } });
    }
    mapToDomain(prismaHighlight) {
        return new highlight_entity_1.Highlight({
            id: prismaHighlight.id,
            contentId: prismaHighlight.content_id,
            userId: prismaHighlight.user_id,
            kind: prismaHighlight.kind,
            targetType: prismaHighlight.target_type,
            pageNumber: prismaHighlight.page_number,
            anchor: prismaHighlight.anchor_json,
            colorKey: prismaHighlight.color_key,
            commentText: prismaHighlight.comment_text,
            tags: prismaHighlight.tags_json,
            timestampMs: prismaHighlight.timestamp_ms,
            durationMs: prismaHighlight.duration_ms,
            visibility: prismaHighlight.visibility,
            visibilityScope: prismaHighlight.visibility_scope,
            contextType: prismaHighlight.context_type,
            contextId: prismaHighlight.context_id,
            learnerId: prismaHighlight.learner_id,
            status: prismaHighlight.status,
            createdAt: prismaHighlight.created_at,
            updatedAt: prismaHighlight.updated_at,
        });
    }
};
exports.PrismaHighlightsRepository = PrismaHighlightsRepository;
exports.PrismaHighlightsRepository = PrismaHighlightsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaHighlightsRepository);
//# sourceMappingURL=prisma-highlights.repository.js.map