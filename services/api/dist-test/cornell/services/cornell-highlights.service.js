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
exports.CornellHighlightsService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const crypto = require("crypto");
const prisma_service_1 = require("../../prisma/prisma.service");
const enums_1 = require("../../common/constants/enums");
const cornell_events_1 = require("../events/cornell.events");
let CornellHighlightsService = class CornellHighlightsService {
    constructor(prisma, eventEmitter) {
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
    }
    async createHighlight(contentId, userId, dto) {
        if (dto.visibility === enums_1.AnnotationVisibility.GROUP) {
            await this.validateContextAccess(userId, dto.context_type, dto.context_id, dto.visibility_scope, dto.learner_id);
        }
        const highlight = await this.prisma.highlights.create({
            data: {
                id: crypto.randomUUID(),
                content_id: contentId,
                user_id: userId,
                kind: this.getHighlightKind(dto.target_type),
                target_type: dto.target_type,
                page_number: dto.page_number,
                anchor_json: (dto.anchor_json || {}),
                timestamp_ms: dto.timestamp_ms,
                duration_ms: dto.duration_ms,
                color_key: dto.color_key,
                tags_json: dto.tags_json,
                comment_text: dto.comment_text,
                visibility: dto.visibility || enums_1.AnnotationVisibility.PRIVATE,
                visibility_scope: dto.visibility_scope,
                context_type: dto.context_type,
                context_id: dto.context_id,
                learner_id: dto.learner_id,
                status: enums_1.AnnotationStatus.ACTIVE,
            },
            include: {
                users: { select: { id: true, name: true, email: true } },
            },
        });
        this.eventEmitter.emit(cornell_events_1.CornellEvent.HIGHLIGHT_CREATED, {
            contentId,
            highlightId: highlight.id,
            userId,
            action: cornell_events_1.CornellEvent.HIGHLIGHT_CREATED,
            timestamp: Date.now(),
            data: { type: dto.type },
        });
        return highlight;
    }
    async getHighlights(contentId, userId) {
        const highlights = await this.prisma.highlights.findMany({
            where: {
                content_id: contentId,
                status: enums_1.AnnotationStatus.ACTIVE,
            },
            include: {
                users: { select: { id: true, name: true, email: true } },
                annotation_comments: {
                    where: { status: enums_1.AnnotationStatus.ACTIVE },
                    include: {
                        users: { select: { id: true, name: true } },
                    },
                    orderBy: { created_at: "asc" },
                },
            },
            orderBy: { created_at: "desc" },
        });
        const filtered = await Promise.all(highlights.map(async (h) => {
            const canRead = await this.canReadHighlight(userId, h);
            return canRead ? h : null;
        }));
        return filtered.filter((h) => h !== null);
    }
    async updateVisibility(highlightId, userId, dto) {
        const highlight = await this.prisma.highlights.findUnique({
            where: { id: highlightId },
        });
        if (!highlight) {
            throw new common_1.NotFoundException("Highlight not found");
        }
        if (highlight.user_id !== userId) {
            throw new common_1.ForbiddenException("Only owner can change visibility");
        }
        if (dto.visibility === enums_1.AnnotationVisibility.GROUP) {
            await this.validateContextAccess(userId, dto.context_type, dto.context_id, dto.visibility_scope, dto.learner_id);
        }
        const updated = await this.prisma.highlights.update({
            where: { id: highlightId },
            data: {
                visibility: dto.visibility,
                visibility_scope: dto.visibility_scope,
                context_type: dto.context_type,
                context_id: dto.context_id,
                learner_id: dto.learner_id,
            },
        });
        this.eventEmitter.emit(cornell_events_1.CornellEvent.HIGHLIGHT_UPDATED, {
            contentId: highlight.content_id,
            highlightId,
            userId,
            action: cornell_events_1.CornellEvent.HIGHLIGHT_UPDATED,
            timestamp: Date.now(),
            data: { visibility: dto.visibility },
        });
        return updated;
    }
    async deleteHighlight(highlightId, userId) {
        const highlight = await this.prisma.highlights.findUnique({
            where: { id: highlightId },
        });
        if (!highlight) {
            throw new common_1.NotFoundException("Highlight not found");
        }
        if (highlight.user_id !== userId) {
            throw new common_1.ForbiddenException("Only owner can delete");
        }
        const deleted = await this.prisma.highlights.update({
            where: { id: highlightId },
            data: {
                status: enums_1.AnnotationStatus.DELETED,
                deleted_at: new Date(),
            },
        });
        this.eventEmitter.emit(cornell_events_1.CornellEvent.HIGHLIGHT_DELETED, {
            contentId: highlight.content_id,
            highlightId,
            userId,
            action: cornell_events_1.CornellEvent.HIGHLIGHT_DELETED,
            timestamp: Date.now(),
        });
        return deleted;
    }
    async createComment(highlightId, userId, dto) {
        const highlight = await this.prisma.highlights.findUnique({
            where: { id: highlightId },
        });
        if (!highlight) {
            throw new common_1.NotFoundException("Highlight not found");
        }
        if (!(await this.canReadHighlight(userId, highlight))) {
            throw new common_1.ForbiddenException("Cannot comment on this highlight");
        }
        const comment = await this.prisma.annotation_comments.create({
            data: {
                id: crypto.randomUUID(),
                highlight_id: highlightId,
                user_id: userId,
                text: dto.text,
                status: enums_1.AnnotationStatus.ACTIVE,
                updated_at: new Date(),
            },
            include: {
                users: { select: { id: true, name: true } },
            },
        });
        this.eventEmitter.emit(cornell_events_1.CornellEvent.COMMENT_ADDED, {
            contentId: highlight.content_id,
            highlightId,
            userId,
            action: cornell_events_1.CornellEvent.COMMENT_ADDED,
            timestamp: Date.now(),
            data: { commentId: comment.id },
        });
        return comment;
    }
    async validateContextAccess(userId, contextType, contextId, scope, learnerId) {
        if (!contextType || !contextId) {
            throw new common_1.BadRequestException("context_type and context_id required for GROUP visibility");
        }
        switch (contextType) {
            case enums_1.ContextType.INSTITUTION:
                await this.validateInstitutionAccess(userId, contextId, scope, learnerId);
                break;
            case enums_1.ContextType.GROUP_STUDY:
                await this.validateGroupAccess(userId, contextId);
                break;
            case enums_1.ContextType.FAMILY:
                await this.validateFamilyAccess(userId, contextId);
                break;
        }
    }
    async validateInstitutionAccess(userId, institutionId, scope, learnerId) {
        const member = await this.prisma.institution_members.findFirst({
            where: {
                institution_id: institutionId,
                user_id: userId,
            },
        });
        if (!member || member.status !== "ACTIVE") {
            throw new common_1.ForbiddenException("Not a member of this institution");
        }
        if (scope === enums_1.VisibilityScope.ONLY_EDUCATORS && member.role !== "TEACHER") {
            throw new common_1.ForbiddenException("Only educators can use this scope");
        }
        if (scope === enums_1.VisibilityScope.RESPONSIBLES_OF_LEARNER) {
            if (!learnerId) {
                throw new common_1.BadRequestException("learner_id required for this scope");
            }
            await this.validateIsResponsible(userId, learnerId);
        }
    }
    async validateGroupAccess(userId, groupId) {
        const member = await this.prisma.study_group_members.findUnique({
            where: { group_id_user_id: { group_id: groupId, user_id: userId } },
        });
        if (!member || member.status !== "ACTIVE") {
            throw new common_1.ForbiddenException("Not a member of this group");
        }
    }
    async validateFamilyAccess(userId, familyId) {
        const member = await this.prisma.family_members.findUnique({
            where: { family_id_user_id: { family_id: familyId, user_id: userId } },
        });
        if (!member || member.status !== "ACTIVE") {
            throw new common_1.ForbiddenException("Not a member of this family");
        }
    }
    async validateIsResponsible(userId, learnerId) {
        const relationship = await this.prisma.family_members.findFirst({
            where: {
                user_id: userId,
                families: {
                    family_members: {
                        some: {
                            user_id: learnerId,
                            status: "ACTIVE",
                        },
                    },
                },
                role: { in: ["GUARDIAN"] },
                status: "ACTIVE",
            },
        });
        if (!relationship) {
            throw new common_1.ForbiddenException("Not a responsible for this learner");
        }
    }
    async canReadHighlight(userId, highlight) {
        if (highlight.user_id === userId)
            return true;
        if (highlight.visibility === enums_1.AnnotationVisibility.PUBLIC)
            return true;
        if (highlight.visibility === enums_1.AnnotationVisibility.PRIVATE)
            return false;
        if (highlight.status === enums_1.AnnotationStatus.DELETED)
            return false;
        if (highlight.visibility === enums_1.AnnotationVisibility.GROUP) {
            return this.checkContextMembership(userId, highlight);
        }
        return false;
    }
    async checkContextMembership(userId, highlight) {
        try {
            await this.validateContextAccess(userId, highlight.contextType, highlight.contextId, highlight.visibilityScope, highlight.learnerId);
            return true;
        }
        catch (_a) {
            return false;
        }
    }
    getHighlightKind(targetType) {
        return targetType === "VIDEO" || targetType === "AUDIO" ? "TEXT" : "AREA";
    }
    subscribeToEvents(contentId) {
        return (0, rxjs_1.fromEvent)(this.eventEmitter, "cornell.*").pipe((0, operators_1.filter)((payload) => payload.contentId === contentId), (0, operators_1.map)((payload) => ({
            data: payload,
        })));
    }
};
exports.CornellHighlightsService = CornellHighlightsService;
exports.CornellHighlightsService = CornellHighlightsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2])
], CornellHighlightsService);
//# sourceMappingURL=cornell-highlights.service.js.map