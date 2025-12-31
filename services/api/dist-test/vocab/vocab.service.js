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
exports.VocabService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const get_vocab_list_use_case_1 = require("./application/use-cases/get-vocab-list.use-case");
const add_vocab_list_use_case_1 = require("./application/use-cases/add-vocab-list.use-case");
let VocabService = class VocabService {
    constructor(prisma, getVocabListUseCase, addVocabListUseCase) {
        this.prisma = prisma;
        this.getVocabListUseCase = getVocabListUseCase;
        this.addVocabListUseCase = addVocabListUseCase;
    }
    normalizeWord(word) {
        return word
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }
    async createFromTargetWords(sessionId) {
        const session = await this.prisma.reading_sessions.findUnique({
            where: { id: sessionId },
            select: {
                user_id: true,
                content_id: true,
                target_words_json: true,
                contents: {
                    select: { original_language: true },
                },
            },
        });
        if (!session || !session.target_words_json) {
            return { created: 0, updated: 0, vocabItems: [] };
        }
        const words = session.target_words_json;
        const language = session.contents.original_language;
        const items = words.map((word) => ({
            word,
            language: language,
            contentId: session.content_id,
            exampleNote: word,
        }));
        const result = await this.addVocabListUseCase.execute(session.user_id, items);
        return {
            created: result.createdCount,
            updated: result.updatedCount,
            vocabItems: result.items,
        };
    }
    async createFromUnknownWords(sessionId) {
        const events = await this.prisma.session_events.findMany({
            where: {
                reading_session_id: sessionId,
                event_type: "MARK_UNKNOWN_WORD",
            },
            select: {
                payload_json: true,
            },
        });
        const session = await this.prisma.reading_sessions.findUnique({
            where: { id: sessionId },
            select: {
                user_id: true,
                content_id: true,
                contents: { select: { original_language: true } },
            },
        });
        if (!session)
            return { created: 0, vocabItems: [] };
        const items = events
            .map((event) => {
            const payload = event.payload_json;
            const term = payload.term;
            if (!term)
                return null;
            return {
                word: term,
                language: session.contents.original_language,
                contentId: session.content_id,
                exampleNote: payload.context || term,
            };
        })
            .filter((item) => item !== null);
        const result = await this.addVocabListUseCase.execute(session.user_id, items);
        return {
            created: result.createdCount,
            vocabItems: result.items,
        };
    }
    async getUserVocab(userId, filters) {
        return this.getVocabListUseCase.execute({
            userId,
            language: filters === null || filters === void 0 ? void 0 : filters.language,
            srsStage: filters === null || filters === void 0 ? void 0 : filters.srsStage,
            dueOnly: filters === null || filters === void 0 ? void 0 : filters.dueOnly,
        });
    }
};
exports.VocabService = VocabService;
exports.VocabService = VocabService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        get_vocab_list_use_case_1.GetVocabListUseCase,
        add_vocab_list_use_case_1.AddVocabListUseCase])
], VocabService);
//# sourceMappingURL=vocab.service.js.map