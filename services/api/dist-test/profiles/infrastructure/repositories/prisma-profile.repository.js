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
exports.PrismaProfileRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const profile_entity_1 = require("../../domain/profile.entity");
let PrismaProfileRepository = class PrismaProfileRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByUserId(userId) {
        const found = await this.prisma.learner_profiles.findUnique({
            where: { user_id: userId },
        });
        return found ? this.mapToDomain(found) : null;
    }
    async create(data) {
        const created = await this.prisma.learner_profiles.create({
            data: {
                user_id: data.userId,
                education_level: data.educationLevel,
                daily_time_budget_min: data.dailyTimeBudgetMin || 30,
                reading_level_score: data.readingLevelScore,
                listening_level_score: data.listeningLevelScore,
                writing_level_score: data.writingLevelScore,
                updated_at: new Date(),
            },
        });
        return this.mapToDomain(created);
    }
    async update(userId, data) {
        const updated = await this.prisma.learner_profiles.update({
            where: { user_id: userId },
            data: {
                education_level: data.educationLevel,
                daily_time_budget_min: data.dailyTimeBudgetMin,
                reading_level_score: data.readingLevelScore,
                listening_level_score: data.listeningLevelScore,
                writing_level_score: data.writingLevelScore,
            },
        });
        return this.mapToDomain(updated);
    }
    mapToDomain(item) {
        return new profile_entity_1.Profile({
            userId: item.user_id,
            educationLevel: item.education_level,
            dailyTimeBudgetMin: item.daily_time_budget_min,
            dailyReviewCap: item.daily_review_cap,
            readingLevelScore: item.reading_level_score,
            listeningLevelScore: item.listening_level_score,
            writingLevelScore: item.writing_level_score,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
        });
    }
};
exports.PrismaProfileRepository = PrismaProfileRepository;
exports.PrismaProfileRepository = PrismaProfileRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaProfileRepository);
//# sourceMappingURL=prisma-profile.repository.js.map