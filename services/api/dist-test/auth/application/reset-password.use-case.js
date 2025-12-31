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
exports.ResetPasswordUseCase = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = require("bcrypt");
const prisma_service_1 = require("../../prisma/prisma.service");
let ResetPasswordUseCase = class ResetPasswordUseCase {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async execute(dto) {
        const user = await this.prisma.users.findFirst({
            where: {
                password_reset_token: dto.token,
                password_reset_expires: { gt: new Date() },
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException("Token inválido ou expirado");
        }
        const password_hash = await bcrypt.hash(dto.password, 10);
        await this.prisma.users.update({
            where: { id: user.id },
            data: {
                password_hash,
                password_reset_token: null,
                password_reset_expires: null,
            },
        });
        return { message: "Password updated successfully" };
    }
};
exports.ResetPasswordUseCase = ResetPasswordUseCase;
exports.ResetPasswordUseCase = ResetPasswordUseCase = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ResetPasswordUseCase);
//# sourceMappingURL=reset-password.use-case.js.map