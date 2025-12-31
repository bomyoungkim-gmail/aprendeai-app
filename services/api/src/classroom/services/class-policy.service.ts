import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ClassroomEventService } from "../../events/classroom-event.service";
import { PromptLibraryService } from "../../prompts/prompt-library.service";
import { CreateClassPolicyDto } from "../dto/classroom.dto";
import * as crypto from "crypto";

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
    const policy = await this.prisma.class_policies.upsert({
      where: { classroom_id: dto.classroomId },
      create: {
        id: crypto.randomUUID(),
        classrooms: { connect: { id: dto.classroomId } },
        weekly_units_target: dto.weeklyUnitsTarget ?? 3,
        timebox_default_min: dto.timeboxDefaultMin ?? 20,
        daily_review_cap: dto.dailyReviewCap ?? 30,
        tool_words_gate_enabled: true,
        privacy_mode: dto.privacyMode ?? "AGGREGATED_ONLY",
        intervention_mode: dto.interventionMode ?? "PROMPT_COACH",
        updated_at: new Date(),
      },
      update: {
        weekly_units_target: dto.weeklyUnitsTarget,
        timebox_default_min: dto.timeboxDefaultMin,
        daily_review_cap: dto.dailyReviewCap,
        privacy_mode: dto.privacyMode,
        intervention_mode: dto.interventionMode,
        updated_at: new Date(),
      },
    });

    // Log CLASS_POLICY_SET event
    await this.classroomEventService.logPolicySet(
      `policy_${policy.classroom_id}`,
      dto.classroomId, // Using classroomId as userId for now
      {
        domain: "CLASS",
        type: "CLASS_POLICY_SET",
        data: {
          classroomId: dto.classroomId,
          policy: {
            weeklyUnitsTarget: policy.weekly_units_target,
            timeboxDefaultMin: policy.timebox_default_min,
            toolWordsGateEnabled: policy.tool_words_gate_enabled,
            dailyReviewCap: policy.daily_review_cap,
            privacyMode: policy.privacy_mode,
            interventionMode: policy.intervention_mode,
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
    return this.prisma.class_policies.findUnique({
      where: { classroom_id: classroomId },
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
