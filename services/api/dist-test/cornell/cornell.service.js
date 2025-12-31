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
exports.CornellService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../prisma/prisma.service");
const usage_tracking_service_1 = require("../billing/usage-tracking.service");
const activity_service_1 = require("../activity/activity.service");
const content_access_service_1 = require("./services/content-access.service");
const client_1 = require("@prisma/client");
const get_content_use_case_1 = require("./application/use-cases/get-content.use-case");
const list_content_use_case_1 = require("./application/use-cases/list-content.use-case");
const update_content_use_case_1 = require("./application/use-cases/update-content.use-case");
const delete_content_use_case_1 = require("./application/use-cases/delete-content.use-case");
const get_or_create_cornell_note_use_case_1 = require("./application/use-cases/get-or-create-cornell-note.use-case");
const update_cornell_note_use_case_1 = require("./application/use-cases/update-cornell-note.use-case");
const create_highlight_use_case_1 = require("./application/use-cases/create-highlight.use-case");
const update_highlight_use_case_1 = require("./application/use-cases/update-highlight.use-case");
const delete_highlight_use_case_1 = require("./application/use-cases/delete-highlight.use-case");
const get_highlights_use_case_1 = require("./application/use-cases/get-highlights.use-case");
let CornellService = class CornellService {
    constructor(prisma, usageTracking, activityService, eventEmitter, contentAccessService, getContentUseCase, listContentUseCase, updateContentUseCase, deleteContentUseCase, getOrCreateCornellNoteUseCase, updateCornellNoteUseCase, createHighlightUseCase, updateHighlightUseCase, deleteHighlightUseCase, getHighlightsUseCase) {
        this.prisma = prisma;
        this.usageTracking = usageTracking;
        this.activityService = activityService;
        this.eventEmitter = eventEmitter;
        this.contentAccessService = contentAccessService;
        this.getContentUseCase = getContentUseCase;
        this.listContentUseCase = listContentUseCase;
        this.updateContentUseCase = updateContentUseCase;
        this.deleteContentUseCase = deleteContentUseCase;
        this.getOrCreateCornellNoteUseCase = getOrCreateCornellNoteUseCase;
        this.updateCornellNoteUseCase = updateCornellNoteUseCase;
        this.createHighlightUseCase = createHighlightUseCase;
        this.updateHighlightUseCase = updateHighlightUseCase;
        this.deleteHighlightUseCase = deleteHighlightUseCase;
        this.getHighlightsUseCase = getHighlightsUseCase;
    }
    getEnvironment() {
        const env = process.env.NODE_ENV;
        if (env === "production")
            return client_1.Environment.PROD;
        if (env === "staging")
            return client_1.Environment.STAGING;
        return client_1.Environment.DEV;
    }
    async getMyContents(userId) {
        const { results } = await this.listContentUseCase.execute(userId, { limit: 100 });
        return results.map((content) => ({
            id: content.id,
            title: content.title,
            type: content.type,
            contentType: content.type,
            original_language: content.originalLanguage,
            raw_text: content.rawText,
            owner_type: content.ownerType,
            owner_id: content.ownerId,
            created_at: content.createdAt,
            updated_at: content.updatedAt,
            metadata: content.metadata,
            files: content.file ? Object.assign({}, content.file) : null,
            file: content.file ? Object.assign(Object.assign({}, content.file), { sizeBytes: Number(content.file.sizeBytes) }) : null,
        }));
    }
    async getContent(contentId, userId) {
        const content = await this.getContentUseCase.execute(contentId, userId);
        return {
            id: content.id,
            title: content.title,
            type: content.type,
            contentType: content.type,
            original_language: content.originalLanguage,
            raw_text: content.rawText,
            owner_type: content.ownerType,
            owner_id: content.ownerId,
            scope_type: content.scopeType,
            scope_id: content.scopeId,
            metadata: content.metadata,
            created_at: content.createdAt,
            updated_at: content.updatedAt,
            files: content.file ? Object.assign(Object.assign({}, content.file), { viewUrl: `/api/v1/files/${content.file.id}/view` }) : null,
            file: content.file ? Object.assign(Object.assign({}, content.file), { viewUrl: `/api/v1/files/${content.file.id}/view` }) : null,
        };
    }
    async updateContent(id, userId, dto) {
        const updated = await this.updateContentUseCase.execute(id, userId, dto);
        return {
            id: updated.id,
            title: updated.title,
            metadata: updated.metadata,
            updated_at: updated.updatedAt,
        };
    }
    async deleteContent(contentId, userId) {
        await this.deleteContentUseCase.execute(contentId, userId);
        return { success: true, message: "Content deleted successfully" };
    }
    async bulkDeleteContents(contentIds, userId) {
        if (!contentIds || contentIds.length === 0) {
            throw new common_1.BadRequestException("No content IDs provided");
        }
        const contents = await this.prisma.contents.findMany({
            where: { id: { in: contentIds } },
            select: { id: true, owner_user_id: true, created_by: true },
        });
        const ownedContentIds = contents
            .filter((c) => c.owner_user_id === userId || c.created_by === userId)
            .map((c) => c.id);
        if (ownedContentIds.length === 0) {
            throw new common_1.ForbiddenException("You do not own any of the selected contents");
        }
        await this.prisma.contents.deleteMany({
            where: { id: { in: ownedContentIds } },
        });
        return {
            success: true,
            deleted: ownedContentIds.length,
            skipped: contentIds.length - ownedContentIds.length,
            message: `Successfully deleted ${ownedContentIds.length} content(s)`,
        };
    }
    async getOrCreateCornellNotes(contentId, userId) {
        const note = await this.getOrCreateCornellNoteUseCase.execute(contentId, userId);
        return {
            id: note.id,
            content_id: note.contentId,
            user_id: note.userId,
            cues_json: note.cues,
            notes_json: note.notes,
            summary_text: note.summary,
            created_at: note.createdAt,
            updated_at: note.updatedAt
        };
    }
    async updateCornellNotes(contentId, dto, userId) {
        const note = await this.updateCornellNoteUseCase.execute(contentId, userId, dto);
        return {
            id: note.id,
            cues_json: note.cues,
            notes_json: note.notes,
            summary_text: note.summary,
            updated_at: note.updatedAt
        };
    }
    async getHighlights(contentId, userId) {
        const highlights = await this.getHighlightsUseCase.execute(contentId, userId);
        return highlights.map(h => ({
            id: h.id,
            content_id: h.contentId,
            user_id: h.userId,
            kind: h.kind,
            target_type: h.targetType,
            page_number: h.pageNumber,
            anchor_json: h.anchor,
            color_key: h.colorKey,
            comment_text: h.commentText,
            tags_json: h.tags,
            created_at: h.createdAt,
            updated_at: h.updatedAt
        }));
    }
    async createHighlight(contentId, dto, userId) {
        const h = await this.createHighlightUseCase.execute(contentId, userId, dto);
        return {
            id: h.id,
            content_id: h.contentId,
            user_id: h.userId,
            kind: h.kind,
            target_type: h.targetType,
            page_number: h.pageNumber,
            anchor_json: h.anchor,
            color_key: h.colorKey,
            comment_text: h.commentText,
            tags_json: h.tags,
            created_at: h.createdAt,
            updated_at: h.updatedAt
        };
    }
    async updateHighlight(id, dto, userId) {
        const h = await this.updateHighlightUseCase.execute(id, dto, userId);
        return {
            id: h.id,
            color_key: h.colorKey,
            comment_text: h.commentText,
            tags_json: h.tags,
            updated_at: h.updatedAt
        };
    }
    async deleteHighlight(id, userId) {
        await this.deleteHighlightUseCase.execute(id, userId);
        return { success: true };
    }
};
exports.CornellService = CornellService;
exports.CornellService = CornellService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        usage_tracking_service_1.UsageTrackingService,
        activity_service_1.ActivityService,
        event_emitter_1.EventEmitter2,
        content_access_service_1.ContentAccessService,
        get_content_use_case_1.GetContentUseCase,
        list_content_use_case_1.ListContentUseCase,
        update_content_use_case_1.UpdateContentUseCase,
        delete_content_use_case_1.DeleteContentUseCase,
        get_or_create_cornell_note_use_case_1.GetOrCreateCornellNoteUseCase,
        update_cornell_note_use_case_1.UpdateCornellNoteUseCase,
        create_highlight_use_case_1.CreateHighlightUseCase,
        update_highlight_use_case_1.UpdateHighlightUseCase,
        delete_highlight_use_case_1.DeleteHighlightUseCase,
        get_highlights_use_case_1.GetHighlightsUseCase])
], CornellService);
//# sourceMappingURL=cornell.service.js.map