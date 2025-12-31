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
exports.LoginUseCase = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = require("bcrypt");
const users_repository_interface_1 = require("../../users/domain/users.repository.interface");
const subscription_service_1 = require("../../billing/subscription.service");
const token_generator_service_1 = require("../infrastructure/token-generator.service");
let LoginUseCase = class LoginUseCase {
    constructor(usersRepository, subscriptionService, tokenGenerator) {
        this.usersRepository = usersRepository;
        this.subscriptionService = subscriptionService;
        this.tokenGenerator = tokenGenerator;
    }
    async execute(email, pass) {
        const user = await this.usersRepository.findByEmail(email);
        if (!user ||
            !user.passwordHash ||
            !(await bcrypt.compare(pass, user.passwordHash))) {
            throw new common_1.UnauthorizedException("Invalid credentials");
        }
        const hasSubscription = await this.subscriptionService.hasActiveSubscription("USER", user.id);
        if (!hasSubscription) {
            await this.subscriptionService.createFreeSubscription(user.id);
        }
        return this.tokenGenerator.generateTokenSet(user);
    }
};
exports.LoginUseCase = LoginUseCase;
exports.LoginUseCase = LoginUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(users_repository_interface_1.IUsersRepository)),
    __metadata("design:paramtypes", [Object, subscription_service_1.SubscriptionService,
        token_generator_service_1.TokenGeneratorService])
], LoginUseCase);
//# sourceMappingURL=login.use-case.js.map