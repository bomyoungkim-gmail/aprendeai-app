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
exports.ForgotPasswordUseCase = void 0;
const common_1 = require("@nestjs/common");
const users_repository_interface_1 = require("../../users/domain/users.repository.interface");
const prisma_service_1 = require("../../prisma/prisma.service");
const email_service_1 = require("../../email/email.service");
const urls_config_1 = require("../../config/urls.config");
let ForgotPasswordUseCase = class ForgotPasswordUseCase {
    constructor(usersRepository, prisma, emailService) {
        this.usersRepository = usersRepository;
        this.prisma = prisma;
        this.emailService = emailService;
    }
    async execute(email) {
        const user = await this.usersRepository.findByEmail(email);
        if (!user) {
            return true;
        }
        const token = [...Array(32)]
            .map(() => Math.floor(Math.random() * 16).toString(16))
            .join("");
        const expires = new Date(Date.now() + 3600000);
        await this.prisma.users.update({
            where: { id: user.id },
            data: {
                password_reset_token: token,
                password_reset_expires: expires,
            },
        });
        const resetLink = `${urls_config_1.URL_CONFIG.frontend.base}/reset-password?token=${token}`;
        try {
            await this.emailService.sendEmail({
                to: user.email,
                subject: "Redefinição de Senha - AprendeAI 🔒",
                template: "password-reset",
                context: {
                    name: user.name,
                    resetUrl: resetLink,
                },
            });
        }
        catch (e) {
            console.error("Failed to send reset email:", e);
        }
        return true;
    }
};
exports.ForgotPasswordUseCase = ForgotPasswordUseCase;
exports.ForgotPasswordUseCase = ForgotPasswordUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(users_repository_interface_1.IUsersRepository)),
    __metadata("design:paramtypes", [Object, prisma_service_1.PrismaService,
        email_service_1.EmailService])
], ForgotPasswordUseCase);
//# sourceMappingURL=forgot-password.use-case.js.map