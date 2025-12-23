import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ClassroomEventService } from '../../events/classroom-event.service';
import { PromptLibraryService } from '../../prompts/prompt-library.service';

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
    normalizedWeekStart.setDate(normalizedWeekStart.getDate() - normalizedWeekStart.getDay());
    normalizedWeekStart.setHours(0, 0, 0, 0);

    const plan = await this.prisma.classPlanWeek.create({
      data: {
        classroom: { connect: { id: classroomId } },
        creator: { connect: { id: educatorUserId } },
        weekStart: normalizedWeekStart,
        itemsJson: items, // Required Json field
        toolWordsJson: toolWords || null, // Optional Json field
      },
    });

    // Log CLASS_WEEKLY_PLAN_CREATED event
    await this.classroomEventService.logWeeklyPlanCreated(
      `plan_${plan.id}`,
      classroomId,
      {
        domain: 'CLASS',
        type: 'CLASS_WEEKLY_PLAN_CREATED',
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

    return this.prisma.classPlanWeek.findUnique({
      where: {
        classroomId_weekStart: {
          classroomId,
          weekStart,
        },
      },
    });
  }

  /**
   * Get weekly plan prompt
   */
  getWeeklyPlanPrompt(unitsTarget: number) {
    return this.promptLibrary.getPrompt('CLASS_WEEKLY_PLAN', {
      UNITS: unitsTarget,
    });
  }
}
