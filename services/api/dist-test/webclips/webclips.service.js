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
exports.WebClipsService = void 0;
const common_1 = require("@nestjs/common");
const crypto = require("crypto");
const content_repository_interface_1 = require("../cornell/domain/content.repository.interface");
const sessions_repository_interface_1 = require("../sessions/domain/sessions.repository.interface");
const content_entity_1 = require("../cornell/domain/content.entity");
const reading_session_entity_1 = require("../sessions/domain/reading-session.entity");
let WebClipsService = class WebClipsService {
    constructor(contentRepository, sessionsRepository) {
        this.contentRepository = contentRepository;
        this.sessionsRepository = sessionsRepository;
    }
    async createWebClip(user_id, dto) {
        var _a;
        const rawText = dto.contentText || dto.selectionText || "";
        if (!rawText.trim()) {
            throw new common_1.BadRequestException("Either contentText or selectionText must be provided");
        }
        const limitedText = rawText.slice(0, 50000);
        const content = new content_entity_1.Content({
            id: crypto.randomUUID(),
            type: "WEB_CLIP",
            title: dto.title,
            rawText: limitedText,
            originalLanguage: (dto.languageHint || "PT_BR"),
            metadata: {
                source_url: dto.sourceUrl,
                site_domain: dto.siteDomain,
                capture_mode: dto.captureMode,
                selection_text_preview: (_a = dto.selectionText) === null || _a === void 0 ? void 0 : _a.slice(0, 200),
                tags: dto.tags || ["webclip"],
                captured_at: new Date().toISOString(),
            },
            ownerId: user_id,
            ownerType: "USER",
            scopeType: "USER",
            scopeId: user_id,
        });
        const createdContent = await this.contentRepository.create(content);
        return {
            contentId: createdContent.id,
            readerUrl: `/reader/${createdContent.id}`,
        };
    }
    async startSession(user_id, content_id, dto) {
        const content = await this.contentRepository.findById(content_id);
        if (!content || content.ownerId !== user_id || content.type !== "WEB_CLIP") {
            throw new common_1.BadRequestException("WebClip not found or access denied");
        }
        const version = new content_entity_1.ContentVersion({
            id: crypto.randomUUID(),
            contentId: content_id,
            targetLanguage: content.originalLanguage,
            schoolingLevelTarget: "HIGHER_EDUCATION",
            simplifiedText: content.rawText,
            summary: content.title,
        });
        const createdVersion = await this.contentRepository.addVersion(version);
        const session = new reading_session_entity_1.ReadingSession({
            id: crypto.randomUUID(),
            userId: user_id,
            contentId: content_id,
            phase: "PRE",
            modality: "READING",
            assetLayer: dto.assetLayer || "L1",
            goalStatement: `Read in ${dto.timeboxMin || 15} min`,
            predictionText: "",
            targetWordsJson: [],
        });
        session.contentVersionId = createdVersion.id;
        const createdSession = await this.sessionsRepository.create(session);
        const threadId = `th_web_${createdSession.id}`;
        return {
            readingSessionId: createdSession.id,
            sessionId: createdSession.id,
            threadId: threadId,
            nextPrompt: "Meta do dia em 1 linha + porquê em 1 linha.",
        };
    }
    async getWebClip(user_id, content_id) {
        const content = await this.contentRepository.findById(content_id);
        if (!content || content.ownerId !== user_id || content.type !== "WEB_CLIP") {
            throw new common_1.BadRequestException("WebClip not found");
        }
        return content;
    }
};
exports.WebClipsService = WebClipsService;
exports.WebClipsService = WebClipsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(content_repository_interface_1.IContentRepository)),
    __param(1, (0, common_1.Inject)(sessions_repository_interface_1.ISessionsRepository)),
    __metadata("design:paramtypes", [Object, Object])
], WebClipsService);
//# sourceMappingURL=webclips.service.js.map