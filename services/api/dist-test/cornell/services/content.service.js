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
var ContentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const storage_service_1 = require("./storage.service");
const client_1 = require("@prisma/client");
const video_service_1 = require("../../video/video.service");
const transcription_service_1 = require("../../transcription/transcription.service");
const enforcement_service_1 = require("../../billing/enforcement.service");
const family_service_1 = require("../../family/family.service");
const usage_tracking_service_1 = require("../../billing/usage-tracking.service");
const activity_service_1 = require("../../activity/activity.service");
const mammoth = require("mammoth");
const path = require("path");
const uuid_1 = require("uuid");
const topic_mastery_service_1 = require("../../analytics/topic-mastery.service");
let ContentService = ContentService_1 = class ContentService {
    constructor(prisma, storageService, videoService, transcriptionService, enforcementService, familyService, usageTracking, activityService, topicMastery) {
        this.prisma = prisma;
        this.storageService = storageService;
        this.videoService = videoService;
        this.transcriptionService = transcriptionService;
        this.enforcementService = enforcementService;
        this.familyService = familyService;
        this.usageTracking = usageTracking;
        this.activityService = activityService;
        this.topicMastery = topicMastery;
        this.logger = new common_1.Logger(ContentService_1.name);
    }
    async uploadContent(file, dto, userId) {
        var _a;
        const isVideo = this.videoService.isVideoFile(file.mimetype);
        const isAudio = this.videoService.isAudioFile(file.mimetype);
        const envString = (_a = process.env.NODE_ENV) === null || _a === void 0 ? void 0 : _a.toUpperCase();
        const env = envString === "PRODUCTION"
            ? client_1.Environment.PROD
            : envString === "STAGING"
                ? client_1.Environment.STAGING
                : client_1.Environment.DEV;
        const metric = "content_uploads_per_month";
        const hierarchy = await this.familyService.resolveBillingHierarchy(userId);
        const effectiveScope = await this.enforcementService.enforceHierarchy(hierarchy, metric, 1, env);
        await this.usageTracking.trackUsage({
            scopeType: effectiveScope.scopeType,
            scopeId: effectiveScope.scopeId,
            metric,
            quantity: 1,
            environment: env,
            userId,
        });
        const storageKey = await this.storageService.saveFile(file);
        const filePath = path.join("./uploads", storageKey);
        let rawText = "";
        let duration;
        let thumbnailUrl;
        if (isVideo || isAudio) {
            this.logger.log(`Processing ${isVideo ? "video" : "audio"}: ${file.originalname}`);
            if (isVideo) {
                const metadata = await this.videoService.extractVideoMetadata(filePath);
                duration = metadata.duration;
                try {
                    const thumbnailPath = await this.videoService.generateThumbnail(filePath);
                    thumbnailUrl = `/uploads/thumbnails/${path.basename(thumbnailPath)}`;
                }
                catch (error) {
                    this.logger.warn(`Failed to generate thumbnail: ${error.message}`);
                }
                try {
                    const audioPath = await this.videoService.extractAudioFromVideo(filePath);
                }
                catch (e) {
                }
            }
            this.transcribeInBackground(filePath, file.originalname);
            rawText = "(Transcription Pending)";
        }
        else {
            try {
                rawText = await this.extractText(file);
            }
            catch (error) {
                this.logger.error(`Text extraction failed: ${error.message}`);
            }
            if (!rawText || rawText.trim().length === 0) {
                throw new common_1.BadRequestException("Could not extract text from file");
            }
        }
        const fileRecord = await this.prisma.files.create({
            data: {
                id: (0, uuid_1.v4)(),
                originalFilename: file.originalname,
                mimeType: file.mimetype,
                sizeBytes: file.size,
                storageKey,
                storageProvider: "LOCAL",
            },
        });
        await this.activityService
            .trackActivity(userId, "read")
            .catch((err) => this.logger.warn(`Failed to track upload activity: ${err.message}`));
        let ownerType;
        let ownerId;
        if (dto.scopeType === "FAMILY" || dto.scopeType === "INSTITUTION") {
            ownerType = dto.scopeType;
            ownerId = dto.scopeId || userId;
        }
        else {
            ownerType = "USER";
            ownerId = userId;
        }
        const content = await this.prisma.contents.create({
            data: {
                id: (0, uuid_1.v4)(),
                title: dto.title,
                type: this.getContentType(file.mimetype),
                original_language: dto.originalLanguage,
                raw_text: rawText,
                files: { connect: { id: fileRecord.id } },
                owner_type: ownerType,
                owner_id: ownerId,
                scope_type: dto.scopeType,
                scope_id: dto.scopeId,
                metadata: {
                    duration,
                    thumbnailUrl,
                },
                updated_at: new Date(),
            },
        });
        this.logger.log(`✅ Content uploaded successfully: ${content.id} (${content.title})`);
        return content;
    }
    async createManualContent(userId, dto) {
        if (!dto.title)
            throw new common_1.BadRequestException("Title is required");
        if (!dto.type)
            throw new common_1.BadRequestException("Type is required");
        const ownerType = dto.ownerType || "USER";
        const ownerId = dto.ownerId || userId;
        const content = await this.prisma.contents.create({
            data: {
                id: (0, uuid_1.v4)(),
                title: dto.title,
                type: dto.type,
                original_language: dto.originalLanguage || "PT_BR",
                raw_text: dto.rawText || "",
                owner_type: ownerType,
                owner_id: ownerId,
                scope_type: dto.scopeType || client_1.ScopeType.USER,
                scope_id: dto.scopeId,
                metadata: {
                    duration: dto.duration,
                    thumbnailUrl: dto.thumbnailUrl,
                    sourceUrl: dto.sourceUrl,
                },
                duration: dto.duration,
                source_url: dto.sourceUrl,
                updated_at: new Date(),
            },
        });
        this.logger.log(`✅ Manual content created: ${content.id} (${content.title})`);
        return content;
    }
    async extractText(file) {
        try {
            if (file.mimetype === "application/pdf") {
                return await this.extractPdfText(file.buffer);
            }
            if (file.mimetype ===
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
                return await this.extractDocxText(file.buffer);
            }
            if (file.mimetype === "text/plain") {
                return file.buffer.toString("utf-8");
            }
            throw new common_1.BadRequestException("Unsupported file type");
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to extract text: ${error.message}`);
        }
    }
    async extractPdfText(buffer) {
        this.logger.log(`Starting PDF extraction with unpdf, buffer size: ${buffer.length} bytes`);
        try {
            const { extractText } = await Promise.resolve().then(() => require("unpdf"));
            const uint8Array = new Uint8Array(buffer);
            this.logger.log(`Converted to Uint8Array, length: ${uint8Array.length}`);
            const { text, totalPages } = await extractText(uint8Array, {
                mergePages: true,
            });
            this.logger.log(`PDF extracted successfully. Text length: ${(text === null || text === void 0 ? void 0 : text.length) || 0}, pages: ${totalPages || 0}`);
            if (!text || text.trim().length === 0) {
                this.logger.warn("PDF extraction returned empty text");
                return "(This PDF may be image-based and requires OCR. Text extraction not available yet.)";
            }
            const sanitized = (text || "").replace(/\0/g, "");
            return sanitized;
        }
        catch (error) {
            this.logger.error(`unpdf extraction failed: ${error.message}`, error.stack);
            throw new common_1.BadRequestException(`PDF extraction failed: ${error.message}`);
        }
    }
    async extractDocxText(buffer) {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
    }
    getContentType(mimeType) {
        if (mimeType === "application/pdf")
            return "PDF";
        if (mimeType.includes("wordprocessing"))
            return "DOCX";
        if (mimeType.startsWith("video/"))
            return "VIDEO";
        if (mimeType.startsWith("audio/"))
            return "AUDIO";
        return "PDF";
    }
    async transcribeInBackground(filePath, originalFilename) {
        if (!this.transcriptionService.isAvailable()) {
            this.logger.warn("Transcription service not available (OpenAI API key not configured)");
            return;
        }
        try {
            this.logger.log(`Starting background transcription for ${originalFilename}`);
            const transcription = await this.transcriptionService.transcribe(filePath);
            this.logger.log(`Transcription completed for ${originalFilename}`);
        }
        catch (error) {
            this.logger.error(`Transcription failed for ${originalFilename}: ${error.message}`);
        }
    }
    async searchContent(query, filters, userId) {
        const { type, language, page = 1, limit = 20, recommendForUserId, } = filters;
        const skip = (page - 1) * limit;
        const families = await this.familyService.findAllForUser(userId);
        const familyIds = families.map((f) => f.id);
        const permissionFilter = {
            OR: [
                { owner_type: "USER", owner_id: userId },
                { owner_type: "FAMILY", owner_id: { in: familyIds } },
            ],
        };
        let searchFilter = {
            OR: [
                { title: { contains: query, mode: "insensitive" } },
                { raw_text: { contains: query, mode: "insensitive" } },
            ],
        };
        if (recommendForUserId) {
            const weakTopics = await this.topicMastery.getWeakestTopics(recommendForUserId, 8);
            const topicNames = weakTopics.map((wt) => wt.topic);
            if (topicNames.length > 0) {
                if (!query || query.trim() === "") {
                    searchFilter = {
                        OR: topicNames.map((topic) => ({
                            OR: [
                                { title: { contains: topic, mode: "insensitive" } },
                                { rawText: { contains: topic, mode: "insensitive" } },
                            ],
                        })),
                    };
                }
            }
        }
        const where = {
            AND: [permissionFilter, searchFilter],
        };
        if (type)
            where.type = type;
        if (language)
            where.original_language = language;
        const total = await this.prisma.contents.count({ where });
        const contents = await this.prisma.contents.findMany({
            where,
            skip,
            take: limit,
            orderBy: { created_at: "desc" },
            select: {
                id: true,
                title: true,
                type: true,
                original_language: true,
                raw_text: true,
                created_at: true,
            },
        });
        const results = contents.map((content) => ({
            id: content.id,
            title: content.title,
            type: content.type,
            originalLanguage: content.original_language,
            excerpt: this.generateExcerpt(content.raw_text, query),
            highlights: this.findHighlights(content.raw_text, query),
            createdAt: content.created_at,
        }));
        return {
            results,
            metadata: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasMore: skip + limit < total,
            },
        };
    }
    async getContent(contentId, userId) {
        const content = await this.prisma.contents.findUnique({
            where: { id: contentId },
            include: {
                files: true,
                cornell_notes: {
                    where: { user_id: userId },
                    take: 1,
                },
                _count: {
                    select: {
                        assessments: true,
                        highlights: true,
                    },
                },
            },
        });
        if (!content) {
            throw new common_1.NotFoundException(`Content not found`);
        }
        const hasAccess = await this.canAccessContent(contentId, userId);
        if (!hasAccess) {
            throw new common_1.ForbiddenException("Access denied to this content");
        }
        const contentAny = content;
        const transformedContent = Object.assign(Object.assign({}, contentAny), { _count: contentAny._count
                ? {
                    assessments: Number(contentAny._count.assessments || 0),
                    highlights: Number(contentAny._count.highlights || 0),
                }
                : undefined, file: contentAny.files
                ? Object.assign(Object.assign({}, contentAny.files), { sizeBytes: Number(contentAny.files.sizeBytes) }) : undefined });
        if (transformedContent.cornell_notes &&
            Array.isArray(transformedContent.cornell_notes)) {
            transformedContent.cornell_notes = transformedContent.cornell_notes.map((note) => (Object.assign(Object.assign({}, note), { _count: note._count
                    ? Object.fromEntries(Object.entries(note._count).map(([key, value]) => [
                        key,
                        Number(value),
                    ]))
                    : undefined })));
        }
        return transformedContent;
    }
    generateExcerpt(text, query, length = 200) {
        const lowerText = text.toLowerCase();
        const lowerQuery = query.toLowerCase();
        const index = lowerText.indexOf(lowerQuery);
        if (index === -1) {
            return text.substring(0, length) + "...";
        }
        const start = Math.max(0, index - 50);
        const end = Math.min(text.length, index + query.length + 150);
        let excerpt = text.substring(start, end);
        if (start > 0)
            excerpt = "..." + excerpt;
        if (end < text.length)
            excerpt += "...";
        return excerpt;
    }
    findHighlights(text, query, maxHighlights = 3) {
        const regex = new RegExp(`(.{0,50}${this.escapeRegex(query)}.{0,50})`, "gi");
        const matches = text.match(regex) || [];
        return matches.slice(0, maxHighlights);
    }
    async canAccessContent(contentId, userId) {
        const content = await this.prisma.contents.findUnique({
            where: { id: contentId },
            select: { owner_type: true, owner_id: true },
        });
        if (!content)
            return false;
        if (content.owner_type && content.owner_id) {
            switch (content.owner_type) {
                case "USER":
                    return content.owner_id === userId;
                case "FAMILY":
                    const familyMember = await this.prisma.family_members.findFirst({
                        where: { family_id: content.owner_id, user_id: userId },
                    });
                    return !!familyMember;
                case "INSTITUTION":
                    const institutionMember = await this.prisma.institution_members.findFirst({
                        where: { institution_id: content.owner_id, user_id: userId },
                    });
                    return !!institutionMember;
                default:
                    return false;
            }
        }
        return false;
    }
    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
    async updateContent(id, userId, dto) {
        var _a, _b;
        const content = await this.prisma.contents.findUnique({ where: { id } });
        if (!content)
            throw new common_1.NotFoundException("Content not found");
        if (content.owner_user_id !== userId)
            throw new common_1.ForbiddenException("Access denied");
        const updatedMetadata = Object.assign(Object.assign({}, (content.metadata || {})), { duration: (_a = dto.duration) !== null && _a !== void 0 ? _a : (_b = content.metadata) === null || _b === void 0 ? void 0 : _b.duration });
        return this.prisma.contents.update({
            where: { id },
            data: {
                title: dto.title,
                duration: dto.duration,
                metadata: updatedMetadata,
            },
        });
    }
};
exports.ContentService = ContentService;
exports.ContentService = ContentService = ContentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        storage_service_1.StorageService,
        video_service_1.VideoService,
        transcription_service_1.TranscriptionService,
        enforcement_service_1.EnforcementService,
        family_service_1.FamilyService,
        usage_tracking_service_1.UsageTrackingService,
        activity_service_1.ActivityService,
        topic_mastery_service_1.TopicMasteryService])
], ContentService);
//# sourceMappingURL=content.service.js.map