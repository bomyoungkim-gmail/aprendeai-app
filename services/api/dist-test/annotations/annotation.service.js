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
exports.AnnotationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const study_groups_ws_gateway_1 = require("../websocket/study-groups-ws.gateway");
let AnnotationService = class AnnotationService {
    constructor(prisma, wsGateway) {
        this.prisma = prisma;
        this.wsGateway = wsGateway;
    }
    async create(contentId, userId, dto) {
        const annotation = await this.prisma.annotations.create({
            data: {
                content_id: contentId,
                user_id: userId,
                type: dto.type,
                start_offset: dto.startOffset,
                end_offset: dto.endOffset,
                selected_text: dto.selectedText,
                text: dto.text,
                color: dto.color,
                visibility: dto.visibility,
                group_id: dto.groupId,
                parent_id: dto.parentId,
            },
            include: {
                users: { select: { id: true, name: true } },
                annotations: { select: { id: true, text: true } },
            },
        });
        if (dto.visibility === "GROUP" && dto.groupId) {
            this.wsGateway.emitToGroup(dto.groupId, "annotation:created", annotation);
        }
        return annotation;
    }
    async getByContent(contentId, userId, groupId) {
        return this.prisma.annotations.findMany({
            where: {
                content_id: contentId,
                OR: [
                    { user_id: userId, visibility: "PRIVATE" },
                    { group_id: groupId, visibility: "GROUP" },
                    { visibility: "PUBLIC" },
                ],
            },
            include: {
                users: { select: { id: true, name: true } },
                other_annotations: {
                    include: {
                        users: { select: { id: true, name: true } },
                    },
                    orderBy: { created_at: "asc" },
                },
            },
            orderBy: { start_offset: "asc" },
        });
    }
    async update(id, userId, dto) {
        const annotation = await this.prisma.annotations.findUnique({
            where: { id },
        });
        if (!annotation) {
            throw new common_1.NotFoundException("Annotation not found");
        }
        if (annotation.user_id !== userId) {
            throw new common_1.ForbiddenException("Not your annotation");
        }
        const updated = await this.prisma.annotations.update({
            where: { id },
            data: { text: dto.text },
            include: {
                users: { select: { id: true, name: true } },
            },
        });
        if (annotation.visibility === "GROUP" && annotation.group_id) {
            this.wsGateway.emitToGroup(annotation.group_id, "annotation:updated", updated);
        }
        return updated;
    }
    async delete(id, userId) {
        const annotation = await this.prisma.annotations.findUnique({
            where: { id },
        });
        if (!annotation) {
            throw new common_1.NotFoundException("Annotation not found");
        }
        if (annotation.user_id !== userId) {
            throw new common_1.ForbiddenException("Not your annotation");
        }
        await this.prisma.annotations.delete({ where: { id } });
        if (annotation.visibility === "GROUP" && annotation.group_id) {
            this.wsGateway.emitToGroup(annotation.group_id, "annotation:deleted", {
                id,
            });
        }
        return { deleted: true };
    }
    async searchAnnotations(userId, params) {
        const where = {
            user_id: userId,
            AND: [],
        };
        if (params.query) {
            where.AND.push({
                OR: [
                    { text: { contains: params.query, mode: "insensitive" } },
                    { selected_text: { contains: params.query, mode: "insensitive" } },
                ],
            });
        }
        if (params.type) {
            where.AND.push({ type: params.type });
        }
        if (params.contentId) {
            where.AND.push({ content_id: params.contentId });
        }
        if (params.groupId) {
            where.AND.push({ group_id: params.groupId });
        }
        if (params.color) {
            where.AND.push({ color: params.color });
        }
        if (params.isFavorite !== undefined) {
            where.AND.push({ is_favorite: params.isFavorite });
        }
        if (params.startDate || params.endDate) {
            const dateFilter = {};
            if (params.startDate) {
                dateFilter.gte = new Date(params.startDate);
            }
            if (params.endDate) {
                dateFilter.lte = new Date(params.endDate);
            }
            where.AND.push({ created_at: dateFilter });
        }
        if (where.AND.length === 0) {
            delete where.AND;
        }
        return this.prisma.annotations.findMany({
            where,
            include: {
                users: { select: { id: true, name: true } },
                contents: { select: { id: true, title: true } },
                other_annotations: {
                    include: {
                        users: { select: { id: true, name: true } },
                    },
                },
            },
            orderBy: { created_at: "desc" },
        });
    }
    async createReply(parentId, userId, dto) {
        const parent = await this.prisma.annotations.findUnique({
            where: { id: parentId },
        });
        if (!parent) {
            throw new common_1.NotFoundException("Parent annotation not found");
        }
        const reply = await this.prisma.annotations.create({
            data: {
                content_id: parent.content_id,
                user_id: userId,
                type: "COMMENT",
                start_offset: parent.start_offset,
                end_offset: parent.end_offset,
                text: dto.content,
                color: dto.color,
                visibility: parent.visibility,
                group_id: parent.group_id,
                parent_id: parentId,
            },
            include: {
                users: { select: { id: true, name: true } },
                annotations: true,
            },
        });
        if (parent.visibility === "GROUP" && parent.group_id) {
            this.wsGateway.emitToGroup(parent.group_id, "annotation:reply", reply);
        }
        await this.prisma.session_events.create({
            data: {
                event_type: "ANNOTATION_REPLY_CREATED",
                payload_json: {
                    annotationId: parentId,
                    replyId: reply.id,
                    userId,
                },
            },
        });
        return reply;
    }
    async toggleFavorite(id, userId) {
        const annotation = await this.prisma.annotations.findUnique({
            where: { id },
        });
        if (!annotation) {
            throw new common_1.NotFoundException("Annotation not found");
        }
        if (annotation.user_id !== userId) {
            throw new common_1.ForbiddenException("Not your annotation");
        }
        const updated = await this.prisma.annotations.update({
            where: { id },
            data: { is_favorite: !annotation.is_favorite },
            include: {
                users: { select: { id: true, name: true } },
            },
        });
        await this.prisma.session_events.create({
            data: {
                event_type: "ANNOTATION_FAVORITE_TOGGLED",
                payload_json: {
                    annotationId: id,
                    favorite: updated.is_favorite,
                    userId,
                },
            },
        });
        return updated;
    }
};
exports.AnnotationService = AnnotationService;
exports.AnnotationService = AnnotationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        study_groups_ws_gateway_1.StudyGroupsWebSocketGateway])
], AnnotationService);
//# sourceMappingURL=annotation.service.js.map