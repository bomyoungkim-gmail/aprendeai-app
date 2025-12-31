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
exports.ExtractionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const queue_service_1 = require("../queue/queue.service");
const entitlements_service_1 = require("../billing/entitlements.service");
const usage_tracking_service_1 = require("../billing/usage-tracking.service");
let ExtractionService = class ExtractionService {
    constructor(prisma, queue, entitlements, usageTracking) {
        this.prisma = prisma;
        this.queue = queue;
        this.entitlements = entitlements;
        this.usageTracking = usageTracking;
    }
    async requestExtraction(contentId, userId) {
        var _a;
        const content = await this.prisma.contents.findUnique({
            where: { id: contentId },
        });
        if (!content) {
            throw new common_1.NotFoundException("Content not found");
        }
        if (content.owner_user_id !== userId && content.created_by !== userId) {
            throw new common_1.ForbiddenException("No access to this content");
        }
        try {
            const entitlements = await this.entitlements.resolve("USER", userId, process.env.NODE_ENV || "DEVELOPMENT");
            const hasAccess = ((_a = entitlements.features) === null || _a === void 0 ? void 0 : _a.ai_extract_enabled) === true;
            if (!hasAccess) {
                throw new common_1.ForbiddenException("AI extraction not available in your plan");
            }
        }
        catch (error) {
            throw new common_1.ForbiddenException("AI extraction not available in your plan");
        }
        let extraction = await this.prisma.content_extractions.findUnique({
            where: { content_id: contentId },
        });
        if (!extraction) {
            extraction = await this.prisma.content_extractions.create({
                data: {
                    content_id: contentId,
                    status: "PENDING",
                },
            });
        }
        else if (extraction.status === "DONE") {
            return extraction;
        }
        else if (extraction.status === "RUNNING") {
            return extraction;
        }
        if (extraction.status === "FAILED") {
            extraction = await this.prisma.content_extractions.update({
                where: { id: extraction.id },
                data: { status: "PENDING", updated_at: new Date() },
            });
        }
        await this.usageTracking.trackUsage({
            scopeType: "USER",
            scopeId: userId,
            metric: "extraction_requested",
            quantity: 1,
            environment: process.env.NODE_ENV,
        });
        await this.queue.publishExtractionJob(contentId);
        return extraction;
    }
    async getExtractionStatus(contentId) {
        const extraction = await this.prisma.content_extractions.findUnique({
            where: { content_id: contentId },
            include: {
                contents: {
                    select: {
                        title: true,
                        type: true,
                    },
                },
            },
        });
        if (!extraction) {
            throw new common_1.NotFoundException("Extraction not found");
        }
        return extraction;
    }
    async getChunks(contentId, page, range) {
        const where = { contentId };
        if (page !== undefined) {
            where.page_number = page;
        }
        if (range) {
            const [start, end] = range.split("-").map(Number);
            where.chunk_index = {
                gte: start,
                lte: end,
            };
        }
        const chunks = await this.prisma.content_chunks.findMany({
            where,
            orderBy: { chunk_index: "asc" },
            take: 50,
        });
        return chunks;
    }
};
exports.ExtractionService = ExtractionService;
exports.ExtractionService = ExtractionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        queue_service_1.QueueService,
        entitlements_service_1.EntitlementsService,
        usage_tracking_service_1.UsageTrackingService])
], ExtractionService);
//# sourceMappingURL=extraction.service.js.map