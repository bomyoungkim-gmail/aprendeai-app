"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VocabModule = void 0;
const common_1 = require("@nestjs/common");
const vocab_service_1 = require("./vocab.service");
const vocab_controller_1 = require("./vocab.controller");
const prisma_module_1 = require("../prisma/prisma.module");
const prisma_vocab_repository_1 = require("./infrastructure/repositories/prisma-vocab.repository");
const vocab_repository_interface_1 = require("./domain/vocab.repository.interface");
const get_vocab_list_use_case_1 = require("./application/use-cases/get-vocab-list.use-case");
const add_vocab_list_use_case_1 = require("./application/use-cases/add-vocab-list.use-case");
let VocabModule = class VocabModule {
};
exports.VocabModule = VocabModule;
exports.VocabModule = VocabModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [vocab_controller_1.VocabController],
        providers: [
            vocab_service_1.VocabService,
            get_vocab_list_use_case_1.GetVocabListUseCase,
            add_vocab_list_use_case_1.AddVocabListUseCase,
            {
                provide: vocab_repository_interface_1.IVocabRepository,
                useClass: prisma_vocab_repository_1.PrismaVocabRepository,
            },
        ],
        exports: [vocab_service_1.VocabService, get_vocab_list_use_case_1.GetVocabListUseCase, add_vocab_list_use_case_1.AddVocabListUseCase, vocab_repository_interface_1.IVocabRepository],
    })
], VocabModule);
//# sourceMappingURL=vocab.module.js.map