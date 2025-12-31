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
exports.AssetsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const entitlements_service_1 = require("../billing/entitlements.service");
const queue_service_1 = require("../queue/queue.service");
const crypto_1 = require("crypto");
const crypto = require("crypto");
let AssetsService = class AssetsService {
    constructor(prisma, entitlements, queue) {
        this.prisma = prisma;
        this.entitlements = entitlements;
        this.queue = queue;
    }
    async generateAsset(userId, contentId, dto) {
        const ent = await this.entitlements.resolve("USER", userId);
        const features = ent.features;
        if (!features.ai_cornell_assist_enabled) {
            throw new common_1.ForbiddenException("AI Cornell Assist is not enabled for this user");
        }
        const chunksCount = await this.prisma.content_chunks.count({
            where: { content_id: contentId },
        });
        if (chunksCount === 0) {
            throw new common_1.BadRequestException("Content must be extracted first. Please run extraction before generating assets.");
        }
        const cacheHash = this.calculateCacheHash(contentId, dto);
        const cached = await this.prisma.learning_assets.findFirst({
            where: {
                content_id: contentId,
                layer: dto.layer,
                modality: dto.modality,
                prompt_version: dto.promptVersion || "v1.0",
            },
            orderBy: { created_at: "desc" },
        });
        if (cached) {
            return {
                jobId: null,
                status: "completed",
                asset: cached,
            };
        }
        const jobId = (0, crypto_1.randomUUID)();
        await this.queue.publish("assets.generate", {
            jobId,
            userId,
            contentId,
            layer: dto.layer,
            educationLevel: dto.educationLevel,
            modality: dto.modality,
            selectedHighlightIds: dto.selectedHighlightIds,
            promptVersion: dto.promptVersion || "v1.0",
            timestamp: new Date().toISOString(),
        });
        return {
            jobId,
            status: "queued",
            estimatedTime: 60,
        };
    }
    async getAssets(contentId, filters) {
        return this.prisma.learning_assets.findMany({
            where: Object.assign(Object.assign({ content_id: contentId }, (filters.layer && { layer: filters.layer })), (filters.promptVersion && { prompt_version: filters.promptVersion })),
            orderBy: { created_at: "desc" },
        });
    }
    calculateCacheHash(contentId, dto) {
        const highlightsHash = dto.selectedHighlightIds
            ? crypto
                .createHash("sha256")
                .update(dto.selectedHighlightIds.sort().join(","))
                .digest("hex")
            : "none";
        const data = `${contentId}-${dto.layer}-${dto.educationLevel}-${dto.modality}-${dto.promptVersion || "v1.0"}-${highlightsHash}`;
        return crypto.createHash("sha256").update(data).digest("hex");
    }
    async checkUsageLimits(userId, limits) {
    }
};
exports.AssetsService = AssetsService;
exports.AssetsService = AssetsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        entitlements_service_1.EntitlementsService,
        queue_service_1.QueueService])
], AssetsService);
//# sourceMappingURL=assets.service.js.map