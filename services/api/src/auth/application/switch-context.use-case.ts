import { Injectable, UnauthorizedException, Inject } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { IUsersRepository } from "../../users/domain/users.repository.interface";
import { TokenGeneratorService } from "../infrastructure/token-generator.service";

@Injectable()
export class SwitchContextUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(IUsersRepository)
    private readonly usersRepository: IUsersRepository,
    private readonly tokenGenerator: TokenGeneratorService,
  ) {}

  async execute(userId: string, targetInstitutionId: string | null) {
    // 1. Handle Null Case (Switch to personal context)
    if (!targetInstitutionId) {
      await this.prisma.users.update({
        where: { id: userId },
        data: {
          last_institution_id: null,
          last_context_role: "OWNER",
        },
      });
    } else {
      // 2. Handle Institution Case
      const membership = await this.prisma.institution_members.findFirst({
        where: {
          user_id: userId,
          institution_id: targetInstitutionId,
          status: "ACTIVE",
        },
      });

      if (!membership) {
        throw new UnauthorizedException(
          "User is not an active member of this institution",
        );
      }

      await this.prisma.users.update({
        where: { id: userId },
        data: {
          last_institution_id: targetInstitutionId,
          last_context_role: membership.role as any,
        },
      });
    }

    // Always fetch fresh user with updated roles
    const user = await this.usersRepository.findById(userId);
    if (!user) throw new UnauthorizedException("User not found");

    // Re-issue tokens for the new context
    return this.tokenGenerator.generateTokenSet(user);
  }
}
