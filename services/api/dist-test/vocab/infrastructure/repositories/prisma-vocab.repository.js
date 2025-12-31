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
exports.PrismaVocabRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const vocabulary_entity_1 = require("../../domain/vocabulary.entity");
const client_1 = require("@prisma/client");
const uuid_1 = require("uuid");
let PrismaVocabRepository = class PrismaVocabRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        const created = await this.prisma.user_vocabularies.create({
            data: {
                id: data.id || (0, uuid_1.v4)(),
                user_id: data.userId,
                word: data.word,
                language: data.language,
                content_id: data.contentId,
                srs_stage: data.srsStage,
                due_at: data.dueAt,
                example_note: data.exampleNote,
                meaning_note: data.meaningNote,
                updated_at: new Date(),
            },
        });
        return this.mapToDomain(created);
    }
    async findById(id) {
        const found = await this.prisma.user_vocabularies.findUnique({ where: { id } });
        return found ? this.mapToDomain(found) : null;
    }
    async findByUserAndWord(userId, word, language) {
        const found = await this.prisma.user_vocabularies.findUnique({
            where: {
                user_id_word_language: {
                    user_id: userId,
                    word,
                    language,
                },
            },
        });
        return found ? this.mapToDomain(found) : null;
    }
    async upsert(userId, word, language, createData, updateData) {
        const upserted = await this.prisma.user_vocabularies.upsert({
            where: {
                user_id_word_language: {
                    user_id: userId,
                    word,
                    language,
                },
            },
            create: {
                id: createData.id || (0, uuid_1.v4)(),
                user_id: userId,
                word,
                language,
                content_id: createData.contentId,
                srs_stage: createData.srsStage || client_1.SrsStage.NEW,
                due_at: createData.dueAt || new Date(),
                example_note: createData.exampleNote,
                updated_at: new Date(),
            },
            update: {
                last_seen_at: new Date(),
                updated_at: new Date(),
            },
        });
        return this.mapToDomain(upserted);
    }
    async findAll(userId, filters) {
        const results = await this.prisma.user_vocabularies.findMany({
            where: Object.assign(Object.assign(Object.assign({ user_id: userId }, ((filters === null || filters === void 0 ? void 0 : filters.language) && { language: filters.language })), ((filters === null || filters === void 0 ? void 0 : filters.srsStage) && { srs_stage: filters.srsStage })), ((filters === null || filters === void 0 ? void 0 : filters.dueOnly) && { due_at: { lte: new Date() } })),
            orderBy: [{ due_at: "asc" }, { lapses_count: "desc" }],
        });
        return results.map(this.mapToDomain);
    }
    async countCreatedInBatch(ids) {
        return 0;
    }
    mapToDomain(item) {
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
exports.PrismaVocabRepository = PrismaVocabRepository;
exports.PrismaVocabRepository = PrismaVocabRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaVocabRepository);
//# sourceMappingURL=prisma-vocab.repository.js.map