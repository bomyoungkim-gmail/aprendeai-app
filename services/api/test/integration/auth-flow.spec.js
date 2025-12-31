"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const login_use_case_1 = require("../../src/auth/application/login.use-case");
const switch_context_use_case_1 = require("../../src/auth/application/switch-context.use-case");
const token_generator_service_1 = require("../../src/auth/infrastructure/token-generator.service");
const users_service_1 = require("../../src/users/users.service");
const prisma_service_1 = require("../../src/prisma/prisma.service");
const jwt_1 = require("@nestjs/jwt");
const subscription_service_1 = require("../../src/billing/subscription.service");
const email_service_1 = require("../../src/email/email.service");
const institution_invite_service_1 = require("../../src/institutions/institution-invite.service");
const institution_domain_service_1 = require("../../src/institutions/institution-domain.service");
const approval_service_1 = require("../../src/institutions/approval.service");
const feature_flags_service_1 = require("../../src/common/feature-flags.service");
const config_1 = require("@nestjs/config");
const uuid_1 = require("uuid");
const bcrypt = require("bcrypt");
const refresh_token_use_case_1 = require("../../src/auth/application/refresh-token.use-case");
const register_use_case_1 = require("../../src/auth/application/register.use-case");
const validate_oauth_use_case_1 = require("../../src/auth/application/validate-oauth.use-case");
const forgot_password_use_case_1 = require("../../src/auth/application/forgot-password.use-case");
const reset_password_use_case_1 = require("../../src/auth/application/reset-password.use-case");
const users_repository_1 = require("../../src/users/infrastructure/users.repository");
const users_repository_interface_1 = require("../../src/users/domain/users.repository.interface");
const mockSubscriptionService = {
    hasActiveSubscription: jest.fn().mockResolvedValue(true),
    createFreeSubscription: jest.fn().mockResolvedValue(true),
};
const mockEmailService = { sendEmail: jest.fn() };
const mockInviteService = { validateInvite: jest.fn() };
const mockDomainService = { validateDomain: jest.fn() };
const mockApprovalService = { checkApproval: jest.fn() };
const mockFeatureFlagsService = {
    isEnabled: jest.fn().mockResolvedValue(true),
};
const mockConfigService = { get: jest.fn().mockReturnValue("secret") };
describe("Integration: Auth & Context Flow", () => {
    let module;
    let loginUseCase;
    let switchContextUseCase;
    let prisma;
    let jwtService;
    beforeAll(async () => {
        module = await testing_1.Test.createTestingModule({
            imports: [
                jwt_1.JwtModule.register({
                    secret: "test-secret",
                }),
            ],
            providers: [
                login_use_case_1.LoginUseCase,
                register_use_case_1.RegisterUseCase,
                refresh_token_use_case_1.RefreshTokenUseCase,
                switch_context_use_case_1.SwitchContextUseCase,
                validate_oauth_use_case_1.ValidateOAuthUseCase,
                forgot_password_use_case_1.ForgotPasswordUseCase,
                reset_password_use_case_1.ResetPasswordUseCase,
                token_generator_service_1.TokenGeneratorService,
                users_service_1.UsersService,
                {
                    provide: users_repository_interface_1.IUsersRepository,
                    useClass: users_repository_1.UsersRepository,
                },
                prisma_service_1.PrismaService,
                { provide: subscription_service_1.SubscriptionService, useValue: mockSubscriptionService },
                { provide: email_service_1.EmailService, useValue: mockEmailService },
                { provide: institution_invite_service_1.InstitutionInviteService, useValue: mockInviteService },
                { provide: institution_domain_service_1.InstitutionDomainService, useValue: mockDomainService },
                { provide: approval_service_1.ApprovalService, useValue: mockApprovalService },
                { provide: feature_flags_service_1.FeatureFlagsService, useValue: mockFeatureFlagsService },
                { provide: config_1.ConfigService, useValue: mockConfigService },
            ],
        }).compile();
        loginUseCase = module.get(login_use_case_1.LoginUseCase);
        switchContextUseCase =
            module.get(switch_context_use_case_1.SwitchContextUseCase);
        prisma = module.get(prisma_service_1.PrismaService);
        jwtService = module.get(jwt_1.JwtService);
    });
    afterAll(async () => {
        await module.close();
    });
    describe("Context Switching", () => {
        it("should login, switch context, and receive updated JWT", async () => {
            const userId = (0, uuid_1.v4)();
            const institutionId = (0, uuid_1.v4)();
            const email = `auth-test-${(0, uuid_1.v4)()}@test.com`;
            const password = "password123";
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await prisma.users.create({
                data: {
                    id: userId,
                    email: email,
                    name: "Auth Tester",
                    password_hash: hashedPassword,
                    updated_at: new Date(),
                },
            });
            await prisma.institutions.create({
                data: {
                    id: institutionId,
                    name: "Test University",
                    type: "UNIVERSITY",
                    updated_at: new Date(),
                },
            });
            await prisma.institution_members.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    user_id: userId,
                    institution_id: institutionId,
                    role: "TEACHER",
                    status: "ACTIVE",
                    joined_at: new Date(),
                },
            });
            const loginResult = await loginUseCase.execute(email, password);
            expect(loginResult.access_token).toBeDefined();
            const decodedInitial = jwtService.decode(loginResult.access_token);
            expect(decodedInitial.sub).toBe(userId);
            expect(decodedInitial.institutionId).toBeFalsy();
            const switchResult = await switchContextUseCase.execute(userId, institutionId);
            expect(switchResult.access_token).toBeDefined();
            const decodedSwitched = jwtService.decode(switchResult.access_token);
            expect(decodedSwitched.sub).toBe(userId);
            expect(decodedSwitched.institutionId).toBe(institutionId);
            const dbUser = await prisma.users.findUnique({ where: { id: userId } });
            expect(dbUser === null || dbUser === void 0 ? void 0 : dbUser.last_institution_id).toBe(institutionId);
            await prisma.institution_members.deleteMany({ where: { user_id: userId } });
            await prisma.users.delete({ where: { id: userId } });
            await prisma.institutions.delete({ where: { id: institutionId } });
        });
    });
});
//# sourceMappingURL=auth-flow.spec.js.map