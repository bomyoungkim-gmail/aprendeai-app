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
exports.ContentAccessService = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const prisma_service_1 = require("../../prisma/prisma.service");
let ContentAccessService = class ContentAccessService {
    constructor(prisma, cacheManager) {
        this.prisma = prisma;
        this.cacheManager = cacheManager;
    }
    async canAccessContent(contentId, userId) {
        const cacheKey = `content:access:${contentId}:${userId}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached !== undefined) {
            return cached;
        }
        const hasAccess = await this._checkAccess(contentId, userId);
        await this.cacheManager.set(cacheKey, hasAccess, 5 * 60 * 1000);
        return hasAccess;
    }
    async _checkAccess(contentId, userId) {
        const content = await this.prisma.contents.findUnique({
            where: { id: contentId },
            select: {
                id: true,
                owner_type: true,
                owner_id: true,
                created_by: true,
                scope_type: true,
                scope_id: true,
                institution_id: true,
            },
        });
        if (!content)
            return false;
        if (this.isOwner(content, userId))
            return true;
        if (await this.hasFamilyAccess(content, userId))
            return true;
        if (await this.hasInstitutionAccess(content, userId))
            return true;
        return false;
    }
    isOwner(content, userId) {
        return content.owner_user_id === userId || content.created_by === userId;
    }
    async hasFamilyAccess(content, userId) {
        var _a;
        if (content.scope_type !== "FAMILY" && content.scope_type !== "USER") {
            return false;
        }
        if (!content.owner_user_id)
            return false;
        const ownerUser = await this.prisma.users.findUnique({
            where: { id: content.owner_user_id },
            select: { settings: true },
        });
        const primaryFamilyId = (_a = ownerUser === null || ownerUser === void 0 ? void 0 : ownerUser.settings) === null || _a === void 0 ? void 0 : _a.primaryFamilyId;
        if (!primaryFamilyId)
            return false;
        const familyMember = await this.prisma.family_members.findUnique({
            where: {
                family_id_user_id: {
                    family_id: primaryFamilyId,
                    user_id: userId,
                },
            },
            select: { status: true },
        });
        return (familyMember === null || familyMember === void 0 ? void 0 : familyMember.status) === "ACTIVE";
    }
    async hasInstitutionAccess(content, userId) {
        if (content.scope_type !== "INSTITUTION") {
            return false;
        }
        if (!content.institution_id)
            return false;
        const user = await this.prisma.users.findUnique({
            where: { id: userId },
            select: { last_institution_id: true },
        });
        return (user === null || user === void 0 ? void 0 : user.last_institution_id) === content.institution_id;
    }
    async canAccessFile(fileId, userId) {
        const cacheKey = `file:access:${fileId}:${userId}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached !== undefined) {
            return cached;
        }
        const content = await this.prisma.contents.findFirst({
            where: { file_id: fileId },
            select: { id: true },
        });
        if (!content) {
            return true;
        }
        const hasAccess = await this.canAccessContent(content.id, userId);
        await this.cacheManager.set(cacheKey, hasAccess, 5 * 60 * 1000);
        return hasAccess;
    }
    async invalidateUserAccess(userId) {
    }
    async invalidateContentAccess(contentId) {
    }
};
exports.ContentAccessService = ContentAccessService;
exports.ContentAccessService = ContentAccessService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], ContentAccessService);
//# sourceMappingURL=content-access.service.js.map