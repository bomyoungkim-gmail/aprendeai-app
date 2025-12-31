import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class PermissionEvaluator {
  constructor(private prisma: PrismaService) {}

  /**
   * Check if a user can create a classroom.
   * Logic: Must be INSTITUTION_EDUCATION_ADMIN OR (TEACHER and VERIFIED)
   */
  async canCreateClassroom(userId: string): Promise<boolean> {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user || !user.last_institution_id) return false;

    // Admin bypass
    if (
      user.last_context_role === "INSTITUTION_EDUCATION_ADMIN" ||
      user.last_context_role === "INSTITUTION_ENTERPRISE_ADMIN"
    ) {
      return true;
    }

    if (user.last_context_role !== "TEACHER") return false;

    // Check Verification
    const tv = await this.prisma.teacher_verifications.findUnique({
      where: { user_id: userId },
    });

    return tv?.status === "VERIFIED";
  }

  /**
   * Check if a user can export gradebook for a classroom.
   * Logic: Same as Create Classroom for now (Verified Teacher or Admin)
   */
  async canExportGradebook(
    userId: string,
    classroomId: string,
  ): Promise<boolean> {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user || !user.last_institution_id) return false;

    if (
      user.last_context_role === "INSTITUTION_EDUCATION_ADMIN" ||
      user.last_context_role === "INSTITUTION_ENTERPRISE_ADMIN"
    ) {
      return true;
    }

    if (user.last_context_role !== "TEACHER") return false;

    const tv = await this.prisma.teacher_verifications.findUnique({
      where: { user_id: userId },
    });

    return tv?.status === "VERIFIED";
  }

  /**
   * Check if an actor can unenroll a student from a classroom.
   * Logic:
   * 1. Check InstitutionPolicy.studentUnenrollmentMode
   * 2. If TEACHER_OR_ADMIN_ONLY (default), verify actor is Admin or Verified Teacher.
   */
  async canUnenrollStudent(
    actorId: string,
    classroomId: string,
  ): Promise<boolean> {
    const actor = await this.prisma.users.findUnique({
      where: { id: actorId },
    });
    if (!actor || !actor.last_institution_id) return false;

    // 1. Check Policy
    const policy = await this.prisma.institution_policies.findUnique({
      where: { institution_id: actor.last_institution_id },
    });

    const mode = policy?.student_unenrollment_mode ?? "TEACHER_OR_ADMIN_ONLY";

    if (mode !== "TEACHER_OR_ADMIN_ONLY") {
      // If policy allows STUDENT_SELF, this logic might be different,
      // but here we are checking if *this specific actor* (who might be a teacher) can do it.
      // Assuming strict interpretation: if mode is anything else, we might fallback or need spec.
      // For MVP, if not strict mode, maybe return FALSE or True?
      // User prompt says: "se você tiver outro modo no futuro, trate aqui".
      // Returning false for unknown modes ensures safety.
      return false;
    }

    // 2. Teacher/Admin Strict Check
    if (
      actor.last_context_role === "INSTITUTION_EDUCATION_ADMIN" ||
      actor.last_context_role === "INSTITUTION_ENTERPRISE_ADMIN"
    ) {
      return true;
    }

    if (actor.last_context_role !== "TEACHER") {
      // Students cannot unenroll themselves in this mode
      return false;
    }

    const tv = await this.prisma.teacher_verifications.findUnique({
      where: { user_id: actorId },
    });

    return tv?.status === "VERIFIED";
  }
}
