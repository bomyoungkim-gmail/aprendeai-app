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
exports.PrismaSharingRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const content_share_entity_1 = require("../../domain/entities/content-share.entity");
const annotation_share_entity_1 = require("../../domain/entities/annotation-share.entity");
let PrismaSharingRepository = class PrismaSharingRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async upsertContentShare(share) {
        const upserted = await this.prisma.content_shares.upsert({
            where: {
                content_id_context_type_context_id: {
                    content_id: share.contentId,
                    context_type: share.contextType,
                    context_id: share.contextId,
                },
            },
            update: {
                permission: share.permission,
            },
            create: {
                content_id: share.contentId,
                context_type: share.contextType,
                context_id: share.contextId,
                permission: share.permission,
                created_by: share.createdBy,
            },
        });
        return new content_share_entity_1.ContentShare(upserted.content_id, upserted.context_type, upserted.context_id, upserted.permission, upserted.created_by, upserted.created_at);
    }
    async revokeContentShare(contentId, contextType, contextId) {
        await this.prisma.content_shares.deleteMany({
            where: {
                content_id: contentId,
                context_type: contextType,
                context_id: contextId,
            },
        });
    }
    async upsertAnnotationShare(share) {
        const upserted = await this.prisma.annotation_shares.upsert({
            where: {
                annotation_id_context_type_context_id: {
                    annotation_id: share.annotationId,
                    context_type: share.contextType,
                    context_id: share.contextId,
                },
            },
            update: {
                mode: share.mode,
            },
            create: {
                annotation_id: share.annotationId,
                context_type: share.contextType,
                context_id: share.contextId,
                mode: share.mode,
                created_by: share.createdBy,
            },
        });
        return new annotation_share_entity_1.AnnotationShare(upserted.annotation_id, upserted.context_type, upserted.context_id, upserted.mode, upserted.created_by, upserted.created_at);
    }
    async revokeAnnotationShare(annotationId, contextType, contextId) {
        await this.prisma.annotation_shares.deleteMany({
            where: {
                annotation_id: annotationId,
                context_type: contextType,
                context_id: contextId,
            },
        });
    }
};
exports.PrismaSharingRepository = PrismaSharingRepository;
exports.PrismaSharingRepository = PrismaSharingRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaSharingRepository);
//# sourceMappingURL=prisma-sharing.repository.js.map