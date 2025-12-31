import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ClassroomEventService } from "../../events/classroom-event.service";
import { PromptLibraryService } from "../../prompts/prompt-library.service";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class ClassPlanService {
  constructor(
    private prisma: PrismaService,
    private classroomEventService: ClassroomEventService,
    private promptLibrary: PromptLibraryService,
  ) {}

  /**
   * Create weekly plan for classroom
   */
  async createWeeklyPlan(
    classroomId: string,
    weekStart: Date,
    educatorUserId: string, // Added parameter
    items: string[], // Array of content IDs
    toolWords?: string[],
  ) {
    // Normalize to start of week (Sunday 00:00:00)
    const normalizedWeekStart = new Date(weekStart);
    normalizedWeekStart.setDate(
      normalizedWeekStart.getDate() - normalizedWeekStart.getDay(),
    );
    normalizedWeekStart.setHours(0, 0, 0, 0);

    const plan = await this.prisma.class_plan_weeks.create({
      data: {
        classrooms: { connect: { id: classroomId } },
        users: { connect: { id: educatorUserId } },
        week_start: normalizedWeekStart,
        items_json: items,
        tool_words_json: toolWords || null,
        id: uuidv4(),
        updated_at: new Date(),
      },
    });

    // Log CLASS_WEEKLY_PLAN_CREATED event
    await this.classroomEventService.logWeeklyPlanCreated(
      `plan_${plan.id}`,
      classroomId,
      {
        domain: "CLASS",
        type: "CLASS_WEEKLY_PLAN_CREATED",
        data: {
          classroomId,
          weekStart: weekStart.toISOString(),
          itemCount: items.length,
          toolWordCount: toolWords?.length || 0,
        },
      },
    );

    return plan;
  }

  /**
   * Get current week plan for classroom
   */
  async getCurrentWeekPlan(classroomId: string) {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Sunday
    weekStart.setHours(0, 0, 0, 0);

    return this.prisma.class_plan_weeks.findUnique({
      where: {
        classroom_id_week_start: {
          classroom_id: classroomId,
          week_start: weekStart,
        },
      },
    });
  }

  /**
   * Get weekly plan prompt
   */
  getWeeklyPlanPrompt(unitsTarget: number) {
    return this.promptLibrary.getPrompt("CLASS_WEEKLY_PLAN", {
      UNITS: unitsTarget,
    });
  }
  /**
   * Get all plans for classroom
   */
  async getPlans(classroomId: string) {
    return this.prisma.class_plan_weeks.findMany({
      where: { classroom_id: classroomId },
      orderBy: { week_start: "desc" },
    });
  }
}
