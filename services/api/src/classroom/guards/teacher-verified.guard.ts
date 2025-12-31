import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

/**
 * Guard to ensure user has verified teacher status
 * Only allows access if user has teacher_verification.status === 'VERIFIED'
 */
@Injectable()
export class TeacherVerifiedGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException("User not authenticated");
    }

    // Check if user has verified teacher status
    const verification = await this.prisma.teacher_verifications.findUnique({
      where: { user_id: userId },
      select: { status: true },
    });

    if (!verification) {
      throw new ForbiddenException(
        "Teacher verification required. Please complete teacher verification to access classroom features.",
      );
    }

    if (verification.status !== "VERIFIED") {
      throw new ForbiddenException(
        `Teacher verification status: ${verification.status}. Only VERIFIED teachers can access classroom features.`,
      );
    }

    return true;
  }
}
