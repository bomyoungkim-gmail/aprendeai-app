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
exports.GetPlatformStatsUseCase = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let GetPlatformStatsUseCase = class GetPlatformStatsUseCase {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async execute() {
        const [totalUsers, totalInstitutions, totalFamilies, totalContent, activeUsersThisWeek, newUsersThisMonth,] = await Promise.all([
            this.prisma.users.count(),
            this.prisma.institutions.count(),
            this.prisma.families.count(),
            this.prisma.contents.count(),
            this.prisma.users.count({
                where: {
                    last_login_at: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    },
                },
            }),
            this.prisma.users.count({
                where: {
                    created_at: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    },
                },
            }),
        ]);
        return {
            totalUsers,
            totalInstitutions,
            totalFamilies,
            totalContent,
            activeUsersThisWeek,
            newUsersThisMonth,
        };
    }
};
exports.GetPlatformStatsUseCase = GetPlatformStatsUseCase;
exports.GetPlatformStatsUseCase = GetPlatformStatsUseCase = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GetPlatformStatsUseCase);
//# sourceMappingURL=get-platform-stats.use-case.js.map