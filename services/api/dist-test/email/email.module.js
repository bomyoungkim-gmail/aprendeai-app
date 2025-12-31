"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const email_service_1 = require("./email.service");
const email_processor_1 = require("./email.processor");
const email_controller_1 = require("./email.controller");
const unsubscribe_user_use_case_1 = require("./application/use-cases/unsubscribe-user.use-case");
const users_module_1 = require("../users/users.module");
const prisma_module_1 = require("../prisma/prisma.module");
const email_worker_1 = require("../workers/email.worker");
const family_module_1 = require("../family/family.module");
let EmailModule = class EmailModule {
};
exports.EmailModule = EmailModule;
exports.EmailModule = EmailModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            users_module_1.UsersModule,
            family_module_1.FamilyModule,
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    secret: configService.get("JWT_SECRET"),
                    signOptions: { expiresIn: "30d" },
                }),
                inject: [config_1.ConfigService],
            }),
        ],
        controllers: [email_controller_1.EmailController],
        providers: [email_service_1.EmailService, email_processor_1.EmailProcessor, email_worker_1.EmailWorker, unsubscribe_user_use_case_1.UnsubscribeUserUseCase],
        exports: [email_service_1.EmailService],
    })
], EmailModule);
//# sourceMappingURL=email.module.js.map