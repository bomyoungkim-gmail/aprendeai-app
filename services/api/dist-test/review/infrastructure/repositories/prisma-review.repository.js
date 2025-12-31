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
exports.PrismaReviewRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const vocabulary_entity_1 = require("../../../vocab/domain/vocabulary.entity");
let PrismaReviewRepository = class PrismaReviewRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findDue(userId, limit) {
        const results = await this.prisma.user_vocabularies.findMany({
            where: {
                user_id: userId,
                due_at: { lte: new Date() },
            },
            orderBy: [
                { due_at: "asc" },
                { lapses_count: "desc" },
            ],
            take: limit,
            include: {
                contents: {
                    select: { id: true, title: true },
                },
            },
        });
        return results.map(this.mapVocabToDomain);
    }
    async countDue(userId) {
        return this.prisma.user_vocabularies.count({
            where: {
                user_id: userId,
                due_at: { lte: new Date() },
            },
        });
    }
    async recordAttemptAndUpdateVocab(attempt, vocabUpdate) {
        const { id, srsStage, dueAt, lapsesIncrement, masteryDelta } = vocabUpdate;
        const { dimension } = attempt;
        const updatedVocab = await this.prisma.$transaction(async (tx) => {
            await tx.vocab_attempts.create({
                data: {
                    id: attempt.id,
                    vocab_id: attempt.vocabId,
                    session_id: attempt.sessionId,
                    dimension: attempt.dimension,
                    result: attempt.result,
                },
            });
            const current = await tx.user_vocabularies.findUniqueOrThrow({ where: { id } });
            let newDetails = {
                srs_stage: srsStage,
                due_at: dueAt,
                lapses_count: { increment: lapsesIncrement },
                last_seen_at: new Date(),
            };
            if (dimension === "FORM") {
                newDetails.mastery_form = Math.max(0, Math.min(100, current.mastery_form + masteryDelta));
            }
            else if (dimension === "MEANING") {
                newDetails.mastery_meaning = Math.max(0, Math.min(100, current.mastery_meaning + masteryDelta));
            }
            else if (dimension === "USE") {
                newDetails.mastery_use = Math.max(0, Math.min(100, current.mastery_use + masteryDelta));
            }
            const updated = await tx.user_vocabularies.update({
                where: { id },
                data: newDetails,
                include: {
                    contents: { select: { id: true, title: true } }
                }
            });
            return updated;
        });
        return this.mapVocabToDomain(updatedVocab);
    }
    mapVocabToDomain(item) {
        return new vocabulary_entity_1.Vocabulary({
            id: item.id,
            userId: item.user_id,
            word: item.word,
            language: item.language,
            masteryScore: item.mastery_score,
            lastSeenAt: item.last_seen_at,
            srsStage: item.srs_stage,
            dueAt: item.due_at,
            lapsesCount: item.lapses_count,
            contentId: item.content_id,
            meaningNote: item.meaning_note,
            exampleNote: item.example_note,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
        });
    }
};
exports.PrismaReviewRepository = PrismaReviewRepository;
exports.PrismaReviewRepository = PrismaReviewRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaReviewRepository);
//# sourceMappingURL=prisma-review.repository.js.map