"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchModule = void 0;
const common_1 = require("@nestjs/common");
const search_service_1 = require("./search.service");
const search_controller_1 = require("./search.controller");
const prisma_module_1 = require("../prisma/prisma.module");
const prisma_search_repository_1 = require("./infrastructure/repositories/prisma-search.repository");
const search_use_case_1 = require("./application/use-cases/search.use-case");
const search_repository_interface_1 = require("./domain/interfaces/search.repository.interface");
let SearchModule = class SearchModule {
};
exports.SearchModule = SearchModule;
exports.SearchModule = SearchModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [search_controller_1.SearchController],
        providers: [
            search_service_1.SearchService,
            search_use_case_1.SearchUseCase,
            { provide: search_repository_interface_1.ISearchRepository, useClass: prisma_search_repository_1.PrismaSearchRepository },
        ],
        exports: [search_service_1.SearchService, search_repository_interface_1.ISearchRepository],
    })
], SearchModule);
//# sourceMappingURL=search.module.js.map