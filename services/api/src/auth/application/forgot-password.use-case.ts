import { Injectable, Inject } from "@nestjs/common";
import { IUsersRepository } from "../../users/domain/users.repository.interface";
import { PrismaService } from "../../prisma/prisma.service";
import { EmailService } from "../../email/email.service";
import { URL_CONFIG } from "../../config/urls.config";

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    @Inject(IUsersRepository)
    private readonly usersRepository: IUsersRepository,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async execute(email: string): Promise<boolean> {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      // Return true to prevent enumeration attacks
      return true;
    }

    // Generate random 32-byte hex token
    const token = [...Array(32)]
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join("");
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await this.prisma.users.update({
      where: { id: user.id },
      data: {
        password_reset_token: token,
        password_reset_expires: expires,
      },
    });

    const resetLink = `${URL_CONFIG.frontend.base}/reset-password?token=${token}`;

    try {
      await this.emailService.sendEmail({
        to: user.email,
        subject: "Redefinição de Senha - AprendeAI 🔒",
        template: "password-reset",
        context: {
          name: user.name,
          resetUrl: resetLink,
        },
      });
    } catch (e) {
      console.error("Failed to send reset email:", e);
    }

    return true;
  }
}
