import { Injectable, Inject } from "@nestjs/common";
import { IFamilyRepository } from "../../domain/family.repository.interface";
import { Family } from "../../domain/family.entity";
import { CreateFamilyDto } from "../../dto/create-family.dto";
import { PrismaService } from "../../../prisma/prisma.service";
import { SubscriptionService } from "../../../billing/subscription.service";
import { ScopeType } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class CreateFamilyUseCase {
  constructor(
    @Inject(IFamilyRepository) private readonly repository: IFamilyRepository,
    private readonly prisma: PrismaService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async execute(userId: string, dto: CreateFamilyDto): Promise<Family> {
    return this.prisma.$transaction(async (tx) => {
      const familyId = uuidv4();

      const created = await tx.families.create({
        data: {
          id: familyId,
          name: dto.name,
          owner_user_id: userId,
          updated_at: new Date(),
        },
      });

      await tx.family_members.create({
        data: {
          id: uuidv4(),
          family_id: familyId,
          user_id: userId,
          role: "OWNER",
          status: "ACTIVE",
        },
      });

      // Initial subscription
      await this.subscriptionService.createInitialSubscription(
        ScopeType.FAMILY,
        familyId,
      );

      // Set primary family in user settings
      const user = await tx.users.findUnique({
        where: { id: userId },
        select: { settings: true },
      });
      const currentSettings = (user?.settings as Record<string, any>) || {};

      await tx.users.update({
        where: { id: userId },
        data: {
          settings: {
            ...currentSettings,
            primaryFamilyId: familyId,
          },
        },
      });

      return new Family({
        id: created.id,
        name: created.name,
        ownerUserId: userId,
        createdAt: created.created_at,
        updatedAt: created.updated_at,
      });
    });
  }
}
