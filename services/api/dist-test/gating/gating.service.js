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
exports.GatingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let GatingService = class GatingService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async determineLayer(userId, contentId, requestedLayer) {
        const eligibility = await this.getOrCreateEligibility(userId);
        if (!requestedLayer) {
            if (eligibility.eligible_l3)
                return "L3";
            if (eligibility.eligible_l2)
                return "L2";
            return "L1";
        }
        if (requestedLayer === "L1") {
            return "L1";
        }
        if (requestedLayer === "L2") {
            if (eligibility.eligible_l2) {
                return "L2";
            }
            if (eligibility.eligible_l3) {
                return "L2";
            }
            return "L1";
        }
        if (requestedLayer === "L3") {
            if (eligibility.eligible_l3) {
                return "L3";
            }
            if (eligibility.eligible_l2) {
                return "L2";
            }
            return "L1";
        }
        return "L1";
    }
    async updateEligibility(userId) {
        const eligibleL2 = await this.checkL2Eligibility(userId);
        const eligibleL3 = await this.checkL3Eligibility(userId);
        const reason = {
            l2: eligibleL2 ? "Meets L2 criteria" : "Does not meet L2 criteria",
            l3: eligibleL3 ? "Meets L3 criteria" : "Does not meet L3 criteria",
            updatedAt: new Date().toISOString(),
        };
        await this.prisma.layer_eligibility.upsert({
            where: { user_id: userId },
            create: {
                user_id: userId,
                eligible_l2: eligibleL2,
                eligible_l3: eligibleL3,
                reason_json: reason,
                updated_at: new Date(),
            },
            update: {
                eligible_l2: eligibleL2,
                eligible_l3: eligibleL3,
                reason_json: reason,
                updated_at: new Date(),
            },
        });
    }
    async checkL2Eligibility(userId) {
        const recentSessions = await this.prisma.reading_sessions.findMany({
            where: {
                user_id: userId,
                phase: "FINISHED",
            },
            include: {
                session_outcomes: true,
            },
            orderBy: {
                finished_at: "desc",
            },
            take: 10,
        });
        if (recentSessions.length < 3) {
            return false;
        }
        const sessionsWithOutcomes = recentSessions.filter((s) => s.session_outcomes);
        if (sessionsWithOutcomes.length < 3) {
            return false;
        }
        const avgComprehension = sessionsWithOutcomes.reduce((sum, s) => { var _a; return sum + (((_a = s.session_outcomes) === null || _a === void 0 ? void 0 : _a.comprehension_score) || 0); }, 0) / sessionsWithOutcomes.length;
        const avgFrustration = sessionsWithOutcomes.reduce((sum, s) => { var _a; return sum + (((_a = s.session_outcomes) === null || _a === void 0 ? void 0 : _a.frustration_index) || 0); }, 0) / sessionsWithOutcomes.length;
        return avgComprehension >= 60 && avgFrustration <= 50;
    }
    async checkL3Eligibility(userId) {
        const recentSessions = await this.prisma.reading_sessions.findMany({
            where: {
                user_id: userId,
                phase: "FINISHED",
            },
            include: {
                session_outcomes: true,
            },
            orderBy: {
                finished_at: "desc",
            },
            take: 10,
        });
        if (recentSessions.length < 5) {
            return false;
        }
        const sessionsWithOutcomes = recentSessions.filter((s) => s.session_outcomes);
        if (sessionsWithOutcomes.length < 5) {
            return false;
        }
        const avgComprehension = sessionsWithOutcomes.reduce((sum, s) => { var _a; return sum + (((_a = s.session_outcomes) === null || _a === void 0 ? void 0 : _a.comprehension_score) || 0); }, 0) / sessionsWithOutcomes.length;
        const avgProduction = sessionsWithOutcomes.reduce((sum, s) => { var _a; return sum + (((_a = s.session_outcomes) === null || _a === void 0 ? void 0 : _a.production_score) || 0); }, 0) / sessionsWithOutcomes.length;
        const avgFrustration = sessionsWithOutcomes.reduce((sum, s) => { var _a; return sum + (((_a = s.session_outcomes) === null || _a === void 0 ? void 0 : _a.frustration_index) || 0); }, 0) / sessionsWithOutcomes.length;
        return (avgComprehension >= 75 && avgProduction >= 70 && avgFrustration <= 40);
    }
    async getOrCreateEligibility(userId) {
        let eligibility = await this.prisma.layer_eligibility.findUnique({
            where: { user_id: userId },
        });
        if (!eligibility) {
            eligibility = await this.prisma.layer_eligibility.create({
                data: {
                    user_id: userId,
                    eligible_l2: false,
                    eligible_l3: false,
                    reason_json: {
                        message: "New user - default to L1",
                        createdAt: new Date().toISOString(),
                    },
                    updated_at: new Date(),
                },
            });
        }
        return eligibility;
    }
    async getEligibility(userId) {
        return this.getOrCreateEligibility(userId);
    }
};
exports.GatingService = GatingService;
exports.GatingService = GatingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GatingService);
//# sourceMappingURL=gating.service.js.map