"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassPlanMapper = void 0;
class ClassPlanMapper {
    static toDto(plan) {
        if (!plan)
            return null;
        return {
            id: plan.id,
            classroomId: plan.classroom_id,
            weekStart: plan.week_start,
            createdByEducatorId: plan.created_by_educator_id,
            title: plan.title,
            notes: plan.notes,
            itemsJson: plan.items_json,
            toolWordsJson: plan.tool_words_json,
            checkpointsJson: plan.checkpoints_json,
            createdAt: plan.created_at,
            updatedAt: plan.updated_at,
        };
    }
    static toCollectionDto(plans) {
        return plans.map((p) => this.toDto(p));
    }
}
exports.ClassPlanMapper = ClassPlanMapper;
//# sourceMappingURL=class-plan.mapper.js.map