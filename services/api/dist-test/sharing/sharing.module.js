"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SharingModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../prisma/prisma.module");
const auth_module_1 = require("../auth/auth.module");
const sharing_service_1 = require("./sharing.service");
const threads_service_1 = require("./threads.service");
const content_sharing_controller_1 = require("./content-sharing.controller");
const threads_controller_1 = require("./threads.controller");
const prisma_sharing_repository_1 = require("./infrastructure/repositories/prisma-sharing.repository");
const share_content_use_case_1 = require("./application/use-cases/share-content.use-case");
const revoke_content_share_use_case_1 = require("./application/use-cases/revoke-content-share.use-case");
const share_annotation_use_case_1 = require("./application/use-cases/share-annotation.use-case");
const revoke_annotation_share_use_case_1 = require("./application/use-cases/revoke-annotation-share.use-case");
const sharing_repository_interface_1 = require("./domain/interfaces/sharing.repository.interface");
let SharingModule = class SharingModule {
};
exports.SharingModule = SharingModule;
exports.SharingModule = SharingModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, auth_module_1.AuthModule],
        controllers: [content_sharing_controller_1.ContentSharingController, threads_controller_1.ThreadsController],
        providers: [
            sharing_service_1.SharingService,
            threads_service_1.ThreadsService,
            { provide: sharing_repository_interface_1.ISharingRepository, useClass: prisma_sharing_repository_1.PrismaSharingRepository },
            share_content_use_case_1.ShareContentUseCase,
            revoke_content_share_use_case_1.RevokeContentShareUseCase,
            share_annotation_use_case_1.ShareAnnotationUseCase,
            revoke_annotation_share_use_case_1.RevokeAnnotationShareUseCase,
        ],
        exports: [sharing_service_1.SharingService, threads_service_1.ThreadsService, sharing_repository_interface_1.ISharingRepository],
    })
], SharingModule);
//# sourceMappingURL=sharing.module.js.map