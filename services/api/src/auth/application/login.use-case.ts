import { Injectable, UnauthorizedException, Inject } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../prisma/prisma.service";
import { IUsersRepository } from "../../users/domain/users.repository.interface";
import { SubscriptionService } from "../../billing/subscription.service";
import { LoginResponse } from "../domain/auth.types";
import { TokenGeneratorService } from "../infrastructure/token-generator.service";

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(IUsersRepository)
    private readonly usersRepository: IUsersRepository,
    private readonly subscriptionService: SubscriptionService,
    private readonly tokenGenerator: TokenGeneratorService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(email: string, pass: string): Promise<LoginResponse> {
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Verify against user_identities
    const identity = await (this.prisma as any).user_identities.findUnique({
      where: {
        provider_provider_id: {
          provider: "password",
          provider_id: email.toLowerCase(),
        },
      },
    });

    if (
      !identity ||
      !identity.password_hash ||
      !(await bcrypt.compare(pass, identity.password_hash))
    ) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Validate user has subscription (self-heal)
    const hasSubscription =
      await this.subscriptionService.hasActiveSubscription("USER", user.id);
    if (!hasSubscription) {
      await this.subscriptionService.createFreeSubscription(user.id);
    }

    // Generate tokens via specialized service
    return this.tokenGenerator.generateTokenSet(user);
  }
}
