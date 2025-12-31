import { PrismaService } from "../../prisma/prisma.service";
import { ClassroomEventService } from "../../events/classroom-event.service";
import { PromptLibraryService } from "../../prompts/prompt-library.service";
import { CreateClassPolicyDto } from "../dto/classroom.dto";
export declare class ClassPolicyService {
    private prisma;
    private classroomEventService;
    private promptLibrary;
    constructor(prisma: PrismaService, classroomEventService: ClassroomEventService, promptLibrary: PromptLibraryService);
    upsert(dto: CreateClassPolicyDto): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        timebox_default_min: number;
        daily_review_cap: number;
        tool_words_gate_enabled: boolean;
        privacy_mode: import(".prisma/client").$Enums.ClassPrivacyMode;
        classroom_id: string;
        weekly_units_target: number;
        intervention_mode: import(".prisma/client").$Enums.InterventionMode;
    }>;
    getByClassroom(classroomId: string): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        timebox_default_min: number;
        daily_review_cap: number;
        tool_words_gate_enabled: boolean;
        privacy_mode: import(".prisma/client").$Enums.ClassPrivacyMode;
        classroom_id: string;
        weekly_units_target: number;
        intervention_mode: import(".prisma/client").$Enums.InterventionMode;
    }>;
    getPolicyPrompt(units: number, minutes: number): import("../../prompts/dto/canonical-prompt.dto").CanonicalPrompt;
}
