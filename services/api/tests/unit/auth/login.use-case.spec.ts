import { Test, TestingModule } from "@nestjs/testing";
import { UnauthorizedException } from "@nestjs/common";
import { LoginUseCase } from "../../../src/auth/application/login.use-case";
import { TokenGeneratorService } from "../../../src/auth/infrastructure/token-generator.service";
import { SubscriptionService } from "../../../src/billing/subscription.service";
import * as bcrypt from "bcrypt";

describe("LoginUseCase", () => {
  let useCase: LoginUseCase;
  let usersRepository: any;
  let subscriptionService: any;
  let tokenGenerator: any;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUseCase,
        { provide: "IUsersRepository", useValue: usersRepository },
        { provide: SubscriptionService, useValue: subscriptionService },
        { provide: TokenGeneratorService, useValue: tokenGenerator },
      ],
    }).compile();

    useCase = module.get<LoginUseCase>(LoginUseCase);
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

    await expect(useCase.execute("test@example.com", "wrong")).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("should throw UnauthorizedException if user not found", async () => {
    usersRepository.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute("test@example.com", "password"),
    ).rejects.toThrow(UnauthorizedException);
  });
});
