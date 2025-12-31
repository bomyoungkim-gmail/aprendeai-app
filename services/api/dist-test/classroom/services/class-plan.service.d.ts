import { PrismaService } from "../../prisma/prisma.service";
import { ClassroomEventService } from "../../events/classroom-event.service";
import { PromptLibraryService } from "../../prompts/prompt-library.service";
export declare class ClassPlanService {
    private prisma;
    private classroomEventService;
    private promptLibrary;
    constructor(prisma: PrismaService, classroomEventService: ClassroomEventService, promptLibrary: PromptLibraryService);
    createWeeklyPlan(classroomId: string, weekStart: Date, educatorUserId: string, items: string[], toolWords?: string[]): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        title: string | null;
        notes: string | null;
        classroom_id: string;
        week_start: Date;
        created_by_educator_id: string;
        items_json: import("@prisma/client/runtime/library").JsonValue;
        tool_words_json: import("@prisma/client/runtime/library").JsonValue | null;
        checkpoints_json: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    getCurrentWeekPlan(classroomId: string): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        title: string | null;
        notes: string | null;
        classroom_id: string;
        week_start: Date;
        created_by_educator_id: string;
        items_json: import("@prisma/client/runtime/library").JsonValue;
        tool_words_json: import("@prisma/client/runtime/library").JsonValue | null;
        checkpoints_json: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    getWeeklyPlanPrompt(unitsTarget: number): import("../../prompts/dto/canonical-prompt.dto").CanonicalPrompt;
    getPlans(classroomId: string): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        title: string | null;
        notes: string | null;
        classroom_id: string;
        week_start: Date;
        created_by_educator_id: string;
        items_json: import("@prisma/client/runtime/library").JsonValue;
        tool_words_json: import("@prisma/client/runtime/library").JsonValue | null;
        checkpoints_json: import("@prisma/client/runtime/library").JsonValue | null;
    }[]>;
}
