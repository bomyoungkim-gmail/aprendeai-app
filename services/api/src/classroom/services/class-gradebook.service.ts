import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Parser } from "json2csv";

@Injectable()
export class ClassGradebookService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get gradebook grid for a classroom.
   * Returns list of students with their aggregated scores/status.
   */
  async getGradebook(classroomId: string) {
    // 1. Get all students in classroom
    const enrollments = await this.prisma.enrollments.findMany({
      where: { classroom_id: classroomId, status: "ACTIVE" },
      include: { users: true },
    });

    if (!enrollments.length) return { students: [], assignments: [] };

    // 2. Get all assignments (class plan items) - simplified for MVP
    // Assuming "items" in class_plan_weeks are content IDs.
    const plans = await this.prisma.class_plan_weeks.findMany({
      where: { classroom_id: classroomId },
      orderBy: { week_start: "desc" },
    });

    // Flatten items from all plans
    const allContentIds = new Set<string>();
    plans.forEach((p) => {
      const items = p.items_json as string[];
      if (Array.isArray(items)) {
        items.forEach((id) => allContentIds.add(id));
      }
    });

    // 3. Get results for these contents for these students
    const contentIds = Array.from(allContentIds);
    const results = await this.prisma.game_results.findMany({
      where: {
        user_id: { in: enrollments.map((e) => e.learner_user_id) },
        content_id: { in: contentIds },
      },
    });

    // 4. Build Grid
    // Rows: Students
    // Cols: Content IDs
    const grid = enrollments.map((enrollment) => {
      const student = enrollment.users;
      const studentResults = results.filter((r) => r.user_id === student.id);

      // Map contentId -> score
      const scores = {};
      studentResults.forEach((r) => {
        // Keep highest score or latest? Using highest.
        if (!scores[r.content_id] || r.score > scores[r.content_id]) {
          scores[r.content_id] = r.score;
        }
      });

      return {
        studentId: student.id,
        name: student.name,
        email: student.email,
        scores,
      };
    });

    return {
      contentIds,
      data: grid,
    };
  }

  async exportGradebookCsv(classroomId: string): Promise<string> {
    const { contentIds, data } = await this.getGradebook(classroomId);

    if (data.length === 0) return "";

    // Flatten for CSV
    const rows = data.map((row) => {
      const flatRow: any = {
        Name: row.name,
        Email: row.email,
        ID: row.studentId,
      };
      contentIds.forEach((cId) => {
        flatRow[cId] =
          row.scores[cId] !== undefined ? row.scores[cId].toFixed(1) : "-";
      });
      return flatRow;
    });

    const fields = ["Name", "Email", "ID", ...contentIds];
    const parser = new Parser({ fields });
    return parser.parse(rows);
  }
}
