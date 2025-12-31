"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FamilyPolicyMapper = void 0;
class FamilyPolicyMapper {
    static toDto(policy) {
        if (!policy)
            return null;
        return {
            id: policy.id,
            familyId: policy.family_id,
            learnerUserId: policy.learner_user_id,
            timeboxDefaultMin: policy.timebox_default_min,
            dailyMinMinutes: policy.daily_min_minutes,
            dailyReviewCap: policy.daily_review_cap,
            coReadingDays: policy.co_reading_days,
            coReadingTime: policy.co_reading_time,
            toolWordsGateEnabled: policy.tool_words_gate_enabled,
            privacyMode: policy.privacy_mode,
            updatedAt: policy.updated_at,
        };
    }
    static toCollectionDto(policies) {
        return policies.map((policy) => this.toDto(policy));
    }
}
exports.FamilyPolicyMapper = FamilyPolicyMapper;
//# sourceMappingURL=family-policy.mapper.js.map