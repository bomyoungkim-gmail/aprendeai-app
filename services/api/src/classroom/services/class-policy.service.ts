import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ClassroomEventService } from "../../events/classroom-event.service";
import { PromptLibraryService } from "../../prompts/prompt-library.service";
import { CreateClassPolicyDto } from "../dto/classroom.dto";

@Injectable()
export class ClassPolicyService {
  constructor(
    private prisma: PrismaService,
    private classroomEventService: ClassroomEventService,
    private promptLibrary: PromptLibraryService,
  ) {}

  /**
   * Create or update classroom policy
   */
  async upsert(dto: CreateClassPolicyDto) {
    const policy = await this.prisma.classPolicy.upsert({
      where: { classroomId: dto.classroomId },
      create: {
        classroomId: dto.classroomId,
        weeklyUnitsTarget: dto.weeklyUnitsTarget ?? 3,
        timeboxDefaultMin: dto.timeboxDefaultMin ?? 20,
        dailyReviewCap: dto.dailyReviewCap ?? 30,
        toolWordsGateEnabled: true,
        privacyMode: dto.privacyMode ?? "AGGREGATED_ONLY",
        interventionMode: dto.interventionMode ?? "PROMPT_COACH",
      },
      update: {
        weeklyUnitsTarget: dto.weeklyUnitsTarget,
        timeboxDefaultMin: dto.timeboxDefaultMin,
        dailyReviewCap: dto.dailyReviewCap,
        privacyMode: dto.privacyMode,
        interventionMode: dto.interventionMode,
      },
    });

    // Log CLASS_POLICY_SET event
    await this.classroomEventService.logPolicySet(
      `policy_${policy.classroomId}`,
      dto.classroomId, // Using classroomId as userId for now
      {
        domain: "CLASS",
        type: "CLASS_POLICY_SET",
        data: {
          classroomId: dto.classroomId,
          policy: {
            weeklyUnitsTarget: policy.weeklyUnitsTarget,
            timeboxDefaultMin: policy.timeboxDefaultMin,
            toolWordsGateEnabled: policy.toolWordsGateEnabled,
            dailyReviewCap: policy.dailyReviewCap,
            privacyMode: policy.privacyMode,
            interventionMode: policy.interventionMode,
          },
        },
      },
    );

    return policy;
  }

  /**
   * Get policy for classroom
   */
  async getByClassroom(classroomId: string) {
    return this.prisma.classPolicy.findUnique({
      where: { classroomId },
    });
  }

  /**
   * Get policy setup prompt
   */
  getPolicyPrompt(units: number, minutes: number) {
    return this.promptLibrary.getPrompt("CLASS_POLICY_SET", {
      UNITS: units,
      MIN: minutes,
    });
  }
}
