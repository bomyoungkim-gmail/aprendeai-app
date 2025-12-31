import { Injectable, Inject } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { PrismaService } from "../../prisma/prisma.service";
import { SubscriptionService } from "../../billing/subscription.service";
import { IUsersRepository } from "../../users/domain/users.repository.interface";
import { TokenGeneratorService } from "../infrastructure/token-generator.service";

@Injectable()
export class ValidateOAuthUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionService: SubscriptionService,
    @Inject(IUsersRepository)
    private readonly usersRepository: IUsersRepository,
    private readonly tokenGenerator: TokenGeneratorService,
  ) {}

  async execute(oauthData: {
    oauthId: string;
    oauthProvider: string;
    email: string;
    name?: string;
    picture?: string;
  }) {
    // Check if user exists with this OAuth ID
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

    // Check if user exists with this email
    user = await this.prisma.users.findUnique({
      where: { email: oauthData.email },
    });

    if (user) {
      // Link OAuth to existing account
      return this.prisma.users.update({
        where: { id: user.id },
        data: {
          oauth_provider: oauthData.oauthProvider,
          oauth_id: oauthData.oauthId,
          oauth_picture: oauthData.picture,
        },
      });
    }

    // Create new user with OAuth
    return this.prisma.$transaction(async (tx) => {
      const newUser = await tx.users.create({
        data: {
          id: uuidv4(),
          email: oauthData.email,
          name: oauthData.name || oauthData.email.split("@")[0],
          oauth_provider: oauthData.oauthProvider,
          oauth_id: oauthData.oauthId,
          oauth_picture: oauthData.picture,
          schooling_level: "ADULT",
          status: "ACTIVE",
          password_hash: null, // No password for OAuth users
          updated_at: new Date(),
        } as any,
      });

      await this.subscriptionService.createFreeSubscription(newUser.id);

      return newUser;
    });
  }
}
