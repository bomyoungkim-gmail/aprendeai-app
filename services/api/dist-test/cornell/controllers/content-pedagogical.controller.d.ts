import { ContentPedagogicalService } from "../services/content-pedagogical.service";
import { CreateContentPedagogicalDataDto } from "../dto/create-content-pedagogical-data.dto";
import { CreateGameResultDto } from "../dto/create-game-result.dto";
export declare class ContentPedagogicalController {
    private readonly pedagogicalService;
    constructor(pedagogicalService: ContentPedagogicalService);
    getContext(contentId: string): Promise<{
        pedagogicalData: {
            id: string;
            updated_at: Date;
            content_id: string;
            processed_at: Date;
            vocabulary_triage: import("@prisma/client/runtime/library").JsonValue | null;
            socratic_questions: import("@prisma/client/runtime/library").JsonValue | null;
            quiz_questions: import("@prisma/client/runtime/library").JsonValue | null;
            taboo_cards: import("@prisma/client/runtime/library").JsonValue | null;
            boss_fight_config: import("@prisma/client/runtime/library").JsonValue | null;
            free_recall_prompts: import("@prisma/client/runtime/library").JsonValue | null;
            processing_version: string;
        };
    }>;
    createOrUpdatePedagogical(contentId: string, dto: CreateContentPedagogicalDataDto): Promise<{
        id: string;
        updated_at: Date;
        content_id: string;
        processed_at: Date;
        vocabulary_triage: import("@prisma/client/runtime/library").JsonValue | null;
        socratic_questions: import("@prisma/client/runtime/library").JsonValue | null;
        quiz_questions: import("@prisma/client/runtime/library").JsonValue | null;
        taboo_cards: import("@prisma/client/runtime/library").JsonValue | null;
        boss_fight_config: import("@prisma/client/runtime/library").JsonValue | null;
        free_recall_prompts: import("@prisma/client/runtime/library").JsonValue | null;
        processing_version: string;
    }>;
    recordGameResult(contentId: string, dto: CreateGameResultDto): Promise<void>;
}
