import { Test, TestingModule } from "@nestjs/testing";
import { LoginUseCase } from "../../src/auth/application/login.use-case";
import { SwitchContextUseCase } from "../../src/auth/application/switch-context.use-case";
import { TokenGeneratorService } from "../../src/auth/infrastructure/token-generator.service";
import { UsersService } from "../../src/users/users.service";
import { PrismaService } from "../../src/prisma/prisma.service";
import { JwtService, JwtModule } from "@nestjs/jwt";
import { SubscriptionService } from "../../src/billing/subscription.service";
import { EmailService } from "../../src/email/email.service";
import { InstitutionInviteService } from "../../src/institutions/institution-invite.service";
import { InstitutionDomainService } from "../../src/institutions/institution-domain.service";
import { ApprovalService } from "../../src/institutions/approval.service";
import { FeatureFlagsService } from "../../src/common/feature-flags.service";
import { ConfigService } from "@nestjs/config";
import { v4 as uuidv4 } from "uuid";
import * as bcrypt from "bcrypt";
import { RefreshTokenUseCase } from "../../src/auth/application/refresh-token.use-case";
import { RegisterUseCase } from "../../src/auth/application/register.use-case";
import { ValidateOAuthUseCase } from "../../src/auth/application/validate-oauth.use-case";
import { ForgotPasswordUseCase } from "../../src/auth/application/forgot-password.use-case";
import { ResetPasswordUseCase } from "../../src/auth/application/reset-password.use-case";
import { UsersRepository } from "../../src/users/infrastructure/users.repository";
import { IUsersRepository } from "../../src/users/domain/users.repository.interface";

// Mocks
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
}; // Enable context_role_v2
const mockConfigService = { get: jest.fn().mockReturnValue("secret") };

describe("Integration: Auth & Context Flow", () => {
  let module: TestingModule;
  let loginUseCase: LoginUseCase;
  let switchContextUseCase: SwitchContextUseCase;
  let prisma: PrismaService;
  let jwtService: JwtService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: "test-secret",
        }),
      ],
      providers: [
        LoginUseCase,
        RegisterUseCase,
        RefreshTokenUseCase,
        SwitchContextUseCase,
        ValidateOAuthUseCase,
        ForgotPasswordUseCase,
        ResetPasswordUseCase,
        TokenGeneratorService,
        UsersService,
        {
          provide: IUsersRepository,
          useClass: UsersRepository,
        },
        PrismaService,
        { provide: SubscriptionService, useValue: mockSubscriptionService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: InstitutionInviteService, useValue: mockInviteService },
        { provide: InstitutionDomainService, useValue: mockDomainService },
        { provide: ApprovalService, useValue: mockApprovalService },
        { provide: FeatureFlagsService, useValue: mockFeatureFlagsService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    loginUseCase = module.get<LoginUseCase>(LoginUseCase);
    switchContextUseCase =
      module.get<SwitchContextUseCase>(SwitchContextUseCase);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await module.close();
  });

  describe("Context Switching", () => {
    it("should login, switch context, and receive updated JWT", async () => {
      const userId = uuidv4();
      const institutionId = uuidv4();
      const email = `auth-test-${uuidv4()}@test.com`;
      const password = "password123";
      const hashedPassword = await bcrypt.hash(password, 10);

      // 1. Create User
      const user = await prisma.users.create({
        data: {
          id: userId,
          email: email,
          name: "Auth Tester",
          password_hash: hashedPassword,
          updated_at: new Date(),
        },
      });

      // 2. Create Institution (Target Context)
      await prisma.institutions.create({
        data: {
          id: institutionId,
          name: "Test University",
          type: "UNIVERSITY",
          updated_at: new Date(),
        },
      });

      // 2b. Create Membership (CRITICAL for switchContext)
      await prisma.institution_members.create({
        data: {
          id: uuidv4(),
          user_id: userId,
          institution_id: institutionId,
          role: "TEACHER",
          status: "ACTIVE",
          joined_at: new Date(),
        },
      });

      // 3. Login (verify initial state)
      const loginResult = await loginUseCase.execute(email, password);
      expect(loginResult.access_token).toBeDefined();

      const decodedInitial = jwtService.decode(loginResult.access_token) as any;
      expect(decodedInitial.sub).toBe(userId);
      // Initially institutionId might be null or undefined if not set
      expect(decodedInitial.institutionId).toBeFalsy();

      // 4. Switch Context
      // First, simulate user membership/permission (not strictly enforced by switchContext usually, but good for realism)
      // For now, switchContext just updates the user record.
      const switchResult = await switchContextUseCase.execute(
        userId,
        institutionId,
      );

      expect(switchResult.access_token).toBeDefined();

      // 5. Verify New Token
      const decodedSwitched = jwtService.decode(
        switchResult.access_token,
      ) as any;
      expect(decodedSwitched.sub).toBe(userId);
      expect(decodedSwitched.institutionId).toBe(institutionId);

      // 6. Verify DB State
      const dbUser = await prisma.users.findUnique({ where: { id: userId } }) as any;
      expect(dbUser?.last_institution_id).toBe(institutionId);

      // Cleanup
      await prisma.institution_members.deleteMany({ where: { user_id: userId } });
      await prisma.users.delete({ where: { id: userId } });
      await prisma.institutions.delete({ where: { id: institutionId } });
    });
  });
});
