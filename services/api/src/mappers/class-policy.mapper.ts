import { class_policies } from "@prisma/client";

export class ClassPolicyMapper {
  static toDto(policy: class_policies | null) {
    if (!policy) return null;

    return {
      id: policy.id,
      classroomId: policy.classroom_id,
      timeboxDefaultMin: policy.timebox_default_min,
      weeklyUnitsTarget: policy.weekly_units_target,
      toolWordsGateEnabled: policy.tool_words_gate_enabled,
      dailyReviewCap: policy.daily_review_cap,
      privacyMode: policy.privacy_mode,
      interventionMode: policy.intervention_mode,
      createdAt: policy.created_at,
      updatedAt: policy.updated_at,
    };
  }
}
