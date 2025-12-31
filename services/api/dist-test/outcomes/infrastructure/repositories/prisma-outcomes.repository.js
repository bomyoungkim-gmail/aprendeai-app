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
exports.PrismaOutcomesRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const session_outcome_entity_1 = require("../../domain/session-outcome.entity");
let PrismaOutcomesRepository = class PrismaOutcomesRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async upsert(outcome) {
        const upserted = await this.prisma.session_outcomes.upsert({
            where: { reading_session_id: outcome.readingSessionId },
            create: {
                reading_session_id: outcome.readingSessionId,
                comprehension_score: outcome.comprehensionScore,
                production_score: outcome.productionScore,
                frustration_index: outcome.frustrationIndex,
                computed_at: outcome.computedAt,
            },
            update: {
                comprehension_score: outcome.comprehensionScore,
                production_score: outcome.productionScore,
                frustration_index: outcome.frustrationIndex,
                computed_at: outcome.computedAt,
            },
        });
        return this.mapToDomain(upserted);
    }
    async findBySessionId(sessionId) {
        const found = await this.prisma.session_outcomes.findUnique({
            where: { reading_session_id: sessionId },
        });
        return found ? this.mapToDomain(found) : null;
    }
    mapToDomain(item) {
        return new session_outcome_entity_1.SessionOutcome({
            readingSessionId: item.reading_session_id,
            comprehensionScore: item.comprehension_score,
            productionScore: item.production_score,
            frustrationIndex: item.frustration_index,
            computedAt: item.computed_at,
        });
    }
};
exports.PrismaOutcomesRepository = PrismaOutcomesRepository;
exports.PrismaOutcomesRepository = PrismaOutcomesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaOutcomesRepository);
//# sourceMappingURL=prisma-outcomes.repository.js.map