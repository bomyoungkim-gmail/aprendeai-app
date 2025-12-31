import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class TeacherVerifiedGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.contextRole) {
      throw new ForbiddenException("Access denied");
    }

    // Bypass for Institution Admins
    if (
      user.contextRole === "INSTITUTION_EDUCATION_ADMIN" ||
      user.contextRole === "INSTITUTION_ENTERPRISE_ADMIN" ||
      user.contextRole === "OWNER"
    ) {
      return true;
    }

    // For Teachers, verify status
    if (user.contextRole === "TEACHER") {
      // We need to check if they are VERIFIED
      // Optimization: In a real app we might cache this claim in JWT, but prompts said claims are standard V2 only.
      // So we query DB.
      const verification = await this.prisma.teacher_verifications.findUnique({
        where: { user_id: user.id },
      });

      if (verification && verification.status === "VERIFIED") {
        return true;
      }

      throw new ForbiddenException(
        "Access denied: Teacher verification required",
      );
    }

    // Students/Employees etc -> Deny if this guard is explicitly used?
    // Usually this guard is placed on routes only for Teachers?
    // If a Student hits this, they should fail if the route is for Verified Teachers.
    throw new ForbiddenException(
      "Access denied: Role not authorized for this verified route",
    );
  }
}
