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
exports.CreateHighlightUseCase = void 0;
const common_1 = require("@nestjs/common");
const highlights_repository_interface_1 = require("../../domain/interfaces/highlights.repository.interface");
const usage_tracking_service_1 = require("../../../billing/usage-tracking.service");
const activity_service_1 = require("../../../activity/activity.service");
const event_emitter_1 = require("@nestjs/event-emitter");
const highlight_entity_1 = require("../../domain/entities/highlight.entity");
const client_1 = require("@prisma/client");
const crypto = require("crypto");
let CreateHighlightUseCase = class CreateHighlightUseCase {
    constructor(highlightsRepository, usageTracking, activityService, eventEmitter) {
        this.highlightsRepository = highlightsRepository;
        this.usageTracking = usageTracking;
        this.activityService = activityService;
        this.eventEmitter = eventEmitter;
    }
    async execute(contentId, userId, dto) {
        const highlight = new highlight_entity_1.Highlight({
            id: crypto.randomUUID(),
            contentId,
            userId,
            kind: dto.kind,
            targetType: dto.target_type,
            pageNumber: dto.page_number,
            anchor: dto.anchor_json,
            colorKey: dto.color_key,
            commentText: dto.comment_text,
            tags: dto.tags_json || [],
            timestampMs: dto.timestamp_ms,
            durationMs: dto.duration_ms,
            visibility: dto.visibility,
            visibilityScope: dto.visibility_scope,
            contextType: dto.context_type,
            contextId: dto.context_id,
            learnerId: dto.learner_id,
        });
        await this.usageTracking.trackUsage({
            scopeType: "USER",
            scopeId: userId,
            metric: "highlight_create",
            quantity: 1,
            environment: this.getEnvironment(),
        });
        await this.activityService
            .trackActivity(userId, "annotation")
            .catch(() => { });
        this.eventEmitter.emit("reading.activity", {
            userId,
            contentId,
            activityType: "highlight",
        });
        return this.highlightsRepository.create(highlight);
    }
    getEnvironment() {
        const env = process.env.NODE_ENV;
        if (env === "production")
            return client_1.Environment.PROD;
        if (env === "staging")
            return client_1.Environment.STAGING;
        return client_1.Environment.DEV;
    }
};
exports.CreateHighlightUseCase = CreateHighlightUseCase;
exports.CreateHighlightUseCase = CreateHighlightUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(highlights_repository_interface_1.IHighlightsRepository)),
    __metadata("design:paramtypes", [Object, usage_tracking_service_1.UsageTrackingService,
        activity_service_1.ActivityService,
        event_emitter_1.EventEmitter2])
], CreateHighlightUseCase);
//# sourceMappingURL=create-highlight.use-case.js.map