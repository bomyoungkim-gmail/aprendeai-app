import { class_plan_weeks } from "@prisma/client";

export class ClassPlanMapper {
  static toDto(plan: class_plan_weeks | null) {
    if (!plan) return null;

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

  static toCollectionDto(plans: class_plan_weeks[]) {
    return plans.map((p) => this.toDto(p));
  }
}
