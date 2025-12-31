import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ClassroomPrivacyGuard } from "../../privacy/classroom-privacy-guard.service";
import { PromptLibraryService } from "../../prompts/prompt-library.service";
import { ClassPrivacyMode, StudentData } from "../../privacy/types";

@Injectable()
export class ClassDashboardService {
  constructor(
    private prisma: PrismaService,
    private privacyGuard: ClassroomPrivacyGuard,
    private promptLibrary: PromptLibraryService,
  ) {}

  /**
   * Get teacher dashboard with privacy filtering
   */
  async getTeacherDashboard(classroomId: string) {
    // Get classroom with policy
    const classroom = await this.prisma.classrooms.findUnique({
      where: { id: classroomId },
      include: {
        enrollments: {
          where: { status: "ACTIVE" },
          include: {
            users: true,
          },
        },
      },
    });

    if (!classroom) {
      throw new Error(`Classroom ${classroomId} not found`);
    }

    // Get class policy
    const policy = await this.prisma.class_policies.findUnique({
      where: { classroom_id: classroomId },
    });

    const privacyMode =
      (policy?.privacy_mode as unknown as ClassPrivacyMode) ||
      ClassPrivacyMode.AGGREGATED_ONLY;

    // Calculate stats for each student
    const studentsData: StudentData[] = await Promise.all(
      (classroom as any).enrollments.map(async (enrollment: any) => {
        return this.calculateStudentStats(enrollment.learner_user_id);
      }),
    );

    // Apply privacy filtering
    const filteredStudents = this.privacyGuard.filterStudentList(
      studentsData,
      privacyMode,
    );

    // Calculate class-level aggregates
    const activeCount = classroom.enrollments.length;
    const avgProgress =
      studentsData.reduce((sum, s) => sum + (s.progressPercent || 0), 0) /
      (activeCount || 1);

    return {
      classroomId,
      className: classroom.name,
      activeStudents: activeCount,
      avgProgress: Math.round(avgProgress),
      students: filteredStudents,
      privacyMode,
    };
  }

  /**
   * Calculate stats for individual student
   */
  private async calculateStudentStats(
    learnerUserId: string,
  ): Promise<StudentData> {
    // Get recent sessions
    const sessions = await this.prisma.reading_sessions.findMany({
      where: { user_id: learnerUserId },
      orderBy: { started_at: "desc" },
      take: 10,
    });

    const progressPercent = sessions.length > 0 ? 65 : 0; // TODO (Issue #7): Calculate
    const comprehensionScore = 72; // TODO (Issue #7): Calculate from assessments
    const lastActivityDate = sessions[0]?.started_at || null;

    return {
      learnerUserId,
      progressPercent,
      comprehensionScore,
      lastActivityDate,
      helpRequests: [], // TODO: Query from events
      struggles: [], // TODO: Analyze from events
    };
  }

  /**
   * Get dashboard prompt
   */
  getDashboardPrompt(activeCount: number, avgComprehension: number) {
    return this.promptLibrary.getPrompt("CLASS_DASHBOARD", {
      ACTIVE: activeCount,
      AVG: avgComprehension,
    });
  }
}
