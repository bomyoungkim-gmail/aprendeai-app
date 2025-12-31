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
exports.ValidateOAuthUseCase = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const prisma_service_1 = require("../../prisma/prisma.service");
const subscription_service_1 = require("../../billing/subscription.service");
const users_repository_interface_1 = require("../../users/domain/users.repository.interface");
const token_generator_service_1 = require("../infrastructure/token-generator.service");
let ValidateOAuthUseCase = class ValidateOAuthUseCase {
    constructor(prisma, subscriptionService, usersRepository, tokenGenerator) {
        this.prisma = prisma;
        this.subscriptionService = subscriptionService;
        this.usersRepository = usersRepository;
        this.tokenGenerator = tokenGenerator;
    }
    async execute(oauthData) {
        let user = await this.prisma.users.findFirst({
            where: {
                oauth_provider: oauthData.oauthProvider,
                oauth_id: oauthData.oauthId,
            },
        });
        if (user) {
            if (oauthData.picture && user.oauth_picture !== oauthData.picture) {
                user = await this.prisma.users.update({
                    where: { id: user.id },
                    data: { oauth_picture: oauthData.picture },
                });
            }
            return user;
        }
        user = await this.prisma.users.findUnique({
            where: { email: oauthData.email },
        });
        if (user) {
            return this.prisma.users.update({
                where: { id: user.id },
                data: {
                    oauth_provider: oauthData.oauthProvider,
                    oauth_id: oauthData.oauthId,
                    oauth_picture: oauthData.picture,
                },
            });
        }
        return this.prisma.$transaction(async (tx) => {
            const newUser = await tx.users.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    email: oauthData.email,
                    name: oauthData.name || oauthData.email.split("@")[0],
                    oauth_provider: oauthData.oauthProvider,
                    oauth_id: oauthData.oauthId,
                    oauth_picture: oauthData.picture,
                    schooling_level: "ADULT",
                    status: "ACTIVE",
                    password_hash: null,
                    updated_at: new Date(),
                },
            });
            await this.subscriptionService.createFreeSubscription(newUser.id);
            return newUser;
        });
    }
};
exports.ValidateOAuthUseCase = ValidateOAuthUseCase;
exports.ValidateOAuthUseCase = ValidateOAuthUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)(users_repository_interface_1.IUsersRepository)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        subscription_service_1.SubscriptionService, Object, token_generator_service_1.TokenGeneratorService])
], ValidateOAuthUseCase);
//# sourceMappingURL=validate-oauth.use-case.js.map