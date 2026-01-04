"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const login_use_case_1 = require("../../../src/auth/application/login.use-case");
const token_generator_service_1 = require("../../../src/auth/infrastructure/token-generator.service");
const subscription_service_1 = require("../../../src/billing/subscription.service");
const bcrypt = require("bcrypt");
describe("LoginUseCase", () => {
    let useCase;
    let usersRepository;
    let subscriptionService;
    let tokenGenerator;
    beforeEach(async () => {
        usersRepository = {
            findByEmail: jest.fn(),
        };
        subscriptionService = {
            hasActiveSubscription: jest.fn(),
            createFreeSubscription: jest.fn(),
        };
        tokenGenerator = {
            generateTokenSet: jest.fn(),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                login_use_case_1.LoginUseCase,
                { provide: "IUsersRepository", useValue: usersRepository },
                { provide: subscription_service_1.SubscriptionService, useValue: subscriptionService },
                { provide: token_generator_service_1.TokenGeneratorService, useValue: tokenGenerator },
            ],
        }).compile();
        useCase = module.get(login_use_case_1.LoginUseCase);
    });
    it("should return tokens for valid credentials", async () => {
        const password = "password123";
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = {
            id: "user-1",
            email: "test@example.com",
            passwordHash: hashedPassword,
        };
        usersRepository.findByEmail.mockResolvedValue(user);
        subscriptionService.hasActiveSubscription.mockResolvedValue(true);
        tokenGenerator.generateTokenSet.mockReturnValue({
            access_token: "access",
            refresh_token: "refresh",
        });
        const result = await useCase.execute("test@example.com", password);
        expect(result).toEqual({
            access_token: "access",
            refresh_token: "refresh",
        });
        expect(usersRepository.findByEmail).toHaveBeenCalledWith("test@example.com");
        expect(subscriptionService.hasActiveSubscription).toHaveBeenCalled();
    });
    it("should throw UnauthorizedException for invalid password", async () => {
        const password = "password123";
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = {
            id: "user-1",
            email: "test@example.com",
            passwordHash: hashedPassword,
        };
        usersRepository.findByEmail.mockResolvedValue(user);
        await expect(useCase.execute("test@example.com", "wrong")).rejects.toThrow(common_1.UnauthorizedException);
    });
    it("should throw UnauthorizedException if user not found", async () => {
        usersRepository.findByEmail.mockResolvedValue(null);
        await expect(useCase.execute("test@example.com", "password")).rejects.toThrow(common_1.UnauthorizedException);
    });
});
//# sourceMappingURL=login.use-case.spec.js.map