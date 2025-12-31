import { class_plan_weeks } from "@prisma/client";
export declare class ClassPlanMapper {
    static toDto(plan: class_plan_weeks | null): {
        id: string;
        classroomId: string;
        weekStart: Date;
        createdByEducatorId: string;
        title: string;
        notes: string;
        itemsJson: import("@prisma/client/runtime/library").JsonValue;
        toolWordsJson: import("@prisma/client/runtime/library").JsonValue;
        checkpointsJson: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        updatedAt: Date;
    };
    static toCollectionDto(plans: class_plan_weeks[]): {
        id: string;
        classroomId: string;
        weekStart: Date;
        createdByEducatorId: string;
        title: string;
        notes: string;
        itemsJson: import("@prisma/client/runtime/library").JsonValue;
        toolWordsJson: import("@prisma/client/runtime/library").JsonValue;
        checkpointsJson: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        updatedAt: Date;
    }[];
}
