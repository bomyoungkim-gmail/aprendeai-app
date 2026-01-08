import { Injectable, Inject } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { PrismaService } from "../../prisma/prisma.service";
import { SubscriptionService } from "../../billing/subscription.service";
import { IUsersRepository } from "../../users/domain/users.repository.interface";
import { TokenGeneratorService } from "../infrastructure/token-generator.service";
import { Transactional, TransactionHost } from "@nestjs-cls/transactional";
import { TransactionalAdapterPrisma } from "@nestjs-cls/transactional-adapter-prisma";

@Injectable()
export class ValidateOAuthUseCase {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterPrisma>,
    private readonly prisma: PrismaService,
    private readonly subscriptionService: SubscriptionService,
    @Inject(IUsersRepository)
    private readonly usersRepository: IUsersRepository,
    private readonly tokenGenerator: TokenGeneratorService,
  ) {}

  private get db() {
    return (this.txHost.tx as PrismaService) || this.prisma;
  }

  async execute(oauthData: {
    oauthId: string;
    oauthProvider: string;
    email: string;
    name?: string;
    picture?: string;
  }) {
    // Check if user exists with this OAuth ID (prioritize user_identities)
    let user = null;
    const identity = await (this.db as any).user_identities.findUnique({
      where: {
        provider_provider_id: {
          provider: oauthData.oauthProvider,
          provider_id: oauthData.oauthId,
        },
      },
    });

    if (identity) {
      user = await this.db.users.findUnique({ where: { id: identity.user_id } });
    } else {
      // Fallback removed (Phase 3.1.4 Cleanup)
    }

    if (user) {

      // Dual write updates (ensure identity exists/is updated)
      if (identity) {
         // Should update last_login_at?
         // Yes, for convenience
      }
      return user;
    }

    // Check if user exists with this email
    user = await this.db.users.findUnique({
      where: { email: oauthData.email },
    });

    if (user) {
      // Link OAuth to existing account
      const updatedUser = await this.db.users.update({
        where: { id: user.id },
        data: {
        },
      });

      await (this.db as any).user_identities.upsert({
        where: {
          provider_provider_id: {
            provider: oauthData.oauthProvider,
            provider_id: oauthData.oauthId,
          },
        },
        create: {
          user_id: user.id,
          provider: oauthData.oauthProvider,
          provider_id: oauthData.oauthId,
          email: oauthData.email,
          metadata: oauthData.picture
            ? { picture: oauthData.picture }
            : undefined,
        },
        update: {
          user_id: user.id,
          last_login_at: new Date(),
        },
      });

      return updatedUser;
    }

    // Create new user with OAuth
    return this.createOAuthUserTransaction(oauthData);
  }

  @Transactional()
  private async createOAuthUserTransaction(oauthData: any) {
    const newUser = await this.usersRepository.create({
      id: uuidv4(),
      email: oauthData.email,
      name: oauthData.name || oauthData.email.split("@")[0],
      schooling_level: "ADULT",
      status: "ACTIVE",

      updated_at: new Date(),
    } as any);

    await (this.txHost.tx as any).user_identities.create({
      data: {
        user_id: newUser.id,
        provider: oauthData.oauthProvider,
        provider_id: oauthData.oauthId,
        email: oauthData.email,
        metadata: oauthData.picture
          ? { picture: oauthData.picture }
          : undefined,
      },
    });

    await this.subscriptionService.createFreeSubscription(newUser.id);

    return newUser;
  }
}
