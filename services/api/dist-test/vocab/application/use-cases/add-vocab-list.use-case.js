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
exports.AddVocabListUseCase = void 0;
const common_1 = require("@nestjs/common");
const vocab_repository_interface_1 = require("../../domain/vocab.repository.interface");
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
let AddVocabListUseCase = class AddVocabListUseCase {
    constructor(vocabRepository) {
        this.vocabRepository = vocabRepository;
    }
    async execute(userId, items) {
        const createdIds = [];
        const updatedIds = [];
        const resultItems = [];
        for (const item of items) {
            const normalized = this.normalizeWord(item.word);
            const result = await this.vocabRepository.upsert(userId, normalized, item.language, {
                word: normalized,
                language: item.language,
                contentId: item.contentId,
                srsStage: client_1.SrsStage.NEW,
                dueAt: (0, date_fns_1.addDays)(new Date(), 1),
                exampleNote: item.exampleNote || item.word,
                meaningNote: item.meaningNote,
            }, {});
            const isNew = result.createdAt.getTime() > (Date.now() - 2000);
            if (isNew) {
                createdIds.push(result.id);
            }
            else {
                updatedIds.push(result.id);
            }
            resultItems.push(result);
        }
        return {
            createdCount: createdIds.length,
            updatedCount: updatedIds.length,
            items: resultItems,
        };
    }
    normalizeWord(word) {
        return word
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }
};
exports.AddVocabListUseCase = AddVocabListUseCase;
exports.AddVocabListUseCase = AddVocabListUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(vocab_repository_interface_1.IVocabRepository)),
    __metadata("design:paramtypes", [Object])
], AddVocabListUseCase);
//# sourceMappingURL=add-vocab-list.use-case.js.map