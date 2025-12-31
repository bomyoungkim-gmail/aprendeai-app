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

    await this.prisma.users.update({
      where: { id: user.id },
      data: {
        password_hash,
        password_reset_token: null,
        password_reset_expires: null,
      },
    });

    return { message: "Password updated successfully" };
  }
}
