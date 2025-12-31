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
exports.FeatureFlagsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let FeatureFlagsService = class FeatureFlagsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async isEnabled(flagKey, userId, institutionId) {
        if (userId) {
            const userFlag = await this.prisma.feature_flags.findFirst({
                where: {
                    key: flagKey,
                    scope_type: "USER",
                    scope_id: userId,
                    enabled: true,
                },
            });
            if (userFlag)
                return true;
        }
        if (institutionId) {
            const institutionFlag = await this.prisma.feature_flags.findFirst({
                where: {
                    key: flagKey,
                    scope_type: "INSTITUTION",
                    scope_id: institutionId,
                    enabled: true,
                },
            });
            if (institutionFlag)
                return true;
        }
        const globalFlag = await this.prisma.feature_flags.findFirst({
            where: {
                key: flagKey,
                scope_type: "GLOBAL",
                enabled: true,
            },
        });
        return !!globalFlag;
    }
    isEnabledSync(flagKey, defaultValue = false) {
        return defaultValue;
    }
    async getEnabledFlags(userId, institutionId) {
        const flags = await this.prisma.feature_flags.findMany({
            where: {
                enabled: true,
                OR: [
                    { scope_type: "GLOBAL" },
                    ...(userId
                        ? [{ scope_type: "USER", scope_id: userId }]
                        : []),
                    ...(institutionId
                        ? [{ scope_type: "INSTITUTION", scope_id: institutionId }]
                        : []),
                ],
            },
            select: { key: true },
        });
        return [...new Set(flags.map((f) => f.key))];
    }
    async enableFlag(flagKey, scopeType = "GLOBAL", scopeId) {
        await this.prisma.feature_flags.upsert({
            where: {
                key_scope_type_scope_id: {
                    key: flagKey,
                    scope_type: scopeType,
                    scope_id: scopeId || "",
                },
            },
            update: {
                enabled: true,
                updated_at: new Date(),
            },
            create: {
                id: crypto.randomUUID(),
                key: flagKey,
                enabled: true,
                scope_type: scopeType,
                scope_id: scopeId || "",
                created_at: new Date(),
                updated_at: new Date(),
            },
        });
    }
    async disableFlag(flagKey, scopeType = "GLOBAL", scopeId) {
        await this.prisma.feature_flags.updateMany({
            where: {
                key: flagKey,
                scope_type: scopeType,
                scope_id: scopeId || "",
            },
            data: {
                enabled: false,
                updated_at: new Date(),
            },
        });
    }
};
exports.FeatureFlagsService = FeatureFlagsService;
exports.FeatureFlagsService = FeatureFlagsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FeatureFlagsService);
//# sourceMappingURL=feature-flags.service.js.map