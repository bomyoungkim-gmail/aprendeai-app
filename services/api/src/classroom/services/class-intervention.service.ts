import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ClassroomEventService } from "../../events/classroom-event.service";
import { PromptLibraryService } from "../../prompts/prompt-library.service";

@Injectable()
export class ClassInterventionService {
  constructor(
    private prisma: PrismaService,
    private classroomEventService: ClassroomEventService,
    private promptLibrary: PromptLibraryService,
  ) {}

  /**
   * Log student help request
   */
  async logHelpRequest(
    classroomId: string,
    learnerUserId: string,
    topic: string,
  ) {
    // Log CLASS_ALERT_RAISED event with HELP_REQUEST type
    await this.classroomEventService.logClassAlert(
      `help_${Date.now()}`,
      learnerUserId,
      {
        domain: "CLASS",
        type: "CLASS_ALERT_RAISED",
        data: {
          classroomId,
          learnerUserId,
          alertType: "HELP_REQUEST",
          severity: "MED",
        },
      },
    );

    return {
      timestamp: new Date(),
      topic,
      status: "PENDING",
    };
  }

  /**
   * Get intervention prompt for teacher
   */
  getInterventionPrompt(studentName: string, topic: string) {
    return this.promptLibrary.getPrompt("CLASS_INTERVENTION_PROMPT", {
      NAME: studentName,
      TOPIC: topic,
    });
  }

  /**
   * Check if intervention mode allows 1:1 sessions
   */
  async canDo1on1(classroomId: string): Promise<boolean> {
    const policy = await this.prisma.classPolicy.findUnique({
      where: { classroomId },
    });

    return policy?.interventionMode === "PROMPT_COACH_PLUS_1ON1";
  }

  /**
   * Get pending help requests for classroom
   */
  async getPendingHelpRequests(classroomId: string) {
    // TODO: Query from SessionEvent or separate table
    return [];
  }
}
