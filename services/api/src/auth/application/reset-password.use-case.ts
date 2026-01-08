import { Injectable, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../prisma/prisma.service";
import { ResetPasswordDto } from "../dto/auth.dto";

@Injectable()
export class ResetPasswordUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(dto: ResetPasswordDto) {
    const user = await this.prisma.users.findFirst({
      where: {
        password_reset_token: dto.token,
        password_reset_expires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new UnauthorizedException("Token inválido ou expirado");
    }

    const password_hash = await bcrypt.hash(dto.password, 10);

    // Verify identity exists
    const identity = await (this.prisma as any).user_identities.findUnique({
      where: {
        provider_provider_id: {
          provider: "password",
          provider_id: user.email,
        },
      },
    });

    if (identity) {
      await (this.prisma as any).user_identities.update({
        where: { id: identity.id },
        data: { password_hash },
      });
    }

    await this.prisma.users.update({
      where: { id: user.id },
      data: {
        password_reset_token: null,
        password_reset_expires: null,
      },
    });

    return { message: "Password updated successfully" };
  }
}
