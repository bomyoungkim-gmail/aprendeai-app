import { Injectable, UnauthorizedException, Inject } from "@nestjs/common";
import * as bcrypt from "bcrypt";
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
  ) {}

  async execute(email: string, pass: string): Promise<LoginResponse> {
    const user = await this.usersRepository.findByEmail(email);

    if (
      !user ||
      !user.passwordHash ||
      !(await bcrypt.compare(pass, user.passwordHash))
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
