"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersModule = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const users_controller_1 = require("./users.controller");
const prisma_module_1 = require("../prisma/prisma.module");
const users_repository_1 = require("./infrastructure/users.repository");
const get_profile_use_case_1 = require("./application/get-profile.use-case");
const update_profile_use_case_1 = require("./application/update-profile.use-case");
const users_repository_interface_1 = require("./domain/users.repository.interface");
let UsersModule = class UsersModule {
};
exports.UsersModule = UsersModule;
exports.UsersModule = UsersModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [users_controller_1.UsersController],
        providers: [
            users_service_1.UsersService,
            get_profile_use_case_1.GetProfileUseCase,
            update_profile_use_case_1.UpdateProfileUseCase,
            {
                provide: users_repository_interface_1.IUsersRepository,
                useClass: users_repository_1.UsersRepository,
            },
        ],
        exports: [users_service_1.UsersService, users_repository_interface_1.IUsersRepository],
    })
], UsersModule);
//# sourceMappingURL=users.module.js.map