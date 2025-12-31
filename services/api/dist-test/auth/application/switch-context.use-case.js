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
exports.SwitchContextUseCase = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const users_repository_interface_1 = require("../../users/domain/users.repository.interface");
const token_generator_service_1 = require("../infrastructure/token-generator.service");
let SwitchContextUseCase = class SwitchContextUseCase {
    constructor(prisma, usersRepository, tokenGenerator) {
        this.prisma = prisma;
        this.usersRepository = usersRepository;
        this.tokenGenerator = tokenGenerator;
    }
    async execute(userId, targetInstitutionId) {
        if (!targetInstitutionId) {
            await this.prisma.users.update({
                where: { id: userId },
                data: {
                    last_institution_id: null,
                    last_context_role: "OWNER",
                },
            });
        }
        else {
            const membership = await this.prisma.institution_members.findFirst({
                where: {
                    user_id: userId,
                    institution_id: targetInstitutionId,
                    status: "ACTIVE",
                },
            });
            if (!membership) {
                throw new common_1.UnauthorizedException("User is not an active member of this institution");
            }
            await this.prisma.users.update({
                where: { id: userId },
                data: {
                    last_institution_id: targetInstitutionId,
                    last_context_role: membership.role,
                },
            });
        }
        const user = await this.usersRepository.findById(userId);
        if (!user)
            throw new common_1.UnauthorizedException("User not found");
        return this.tokenGenerator.generateTokenSet(user);
    }
};
exports.SwitchContextUseCase = SwitchContextUseCase;
exports.SwitchContextUseCase = SwitchContextUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(users_repository_interface_1.IUsersRepository)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object, token_generator_service_1.TokenGeneratorService])
], SwitchContextUseCase);
//# sourceMappingURL=switch-context.use-case.js.map