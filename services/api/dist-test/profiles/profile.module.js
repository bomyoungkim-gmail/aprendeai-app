"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../prisma/prisma.module");
const profile_service_1 = require("./profile.service");
const prisma_profile_repository_1 = require("./infrastructure/repositories/prisma-profile.repository");
const profile_repository_interface_1 = require("./domain/profile.repository.interface");
const get_profile_use_case_1 = require("./application/use-cases/get-profile.use-case");
const update_profile_use_case_1 = require("./application/use-cases/update-profile.use-case");
let ProfileModule = class ProfileModule {
};
exports.ProfileModule = ProfileModule;
exports.ProfileModule = ProfileModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        providers: [
            profile_service_1.ProfileService,
            get_profile_use_case_1.GetProfileUseCase,
            update_profile_use_case_1.UpdateProfileUseCase,
            {
                provide: profile_repository_interface_1.IProfileRepository,
                useClass: prisma_profile_repository_1.PrismaProfileRepository,
            },
        ],
        exports: [profile_service_1.ProfileService, get_profile_use_case_1.GetProfileUseCase, profile_repository_interface_1.IProfileRepository],
    })
], ProfileModule);
//# sourceMappingURL=profile.module.js.map