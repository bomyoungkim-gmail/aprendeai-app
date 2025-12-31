import { family_policies } from "@prisma/client";

export class FamilyPolicyMapper {
  static toDto(policy: family_policies) {
    if (!policy) return null;

    return {
      id: policy.id,
      familyId: policy.family_id,
      learnerUserId: policy.learner_user_id,
      timeboxDefaultMin: policy.timebox_default_min,
      dailyMinMinutes: policy.daily_min_minutes,
      dailyReviewCap: policy.daily_review_cap,
      coReadingDays: policy.co_reading_days as number[],
      coReadingTime: policy.co_reading_time,
      toolWordsGateEnabled: policy.tool_words_gate_enabled,
      privacyMode: policy.privacy_mode,
      updatedAt: policy.updated_at,
    };
  }

  static toCollectionDto(policies: family_policies[]) {
    return policies.map((policy) => this.toDto(policy));
  }
}
