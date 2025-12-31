import { PrismaService } from "../../prisma/prisma.service";
import { Prisma } from "@prisma/client";
export declare class ContentPedagogicalService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createOrUpdatePedagogicalData(contentId: string, data: Omit<Prisma.content_pedagogical_dataUncheckedCreateInput, "content_id" | "id" | "updated_at" | "processed_at">): Promise<{
        id: string;
        updated_at: Date;
        content_id: string;
        processed_at: Date;
        vocabulary_triage: Prisma.JsonValue | null;
        socratic_questions: Prisma.JsonValue | null;
        quiz_questions: Prisma.JsonValue | null;
        taboo_cards: Prisma.JsonValue | null;
        boss_fight_config: Prisma.JsonValue | null;
        free_recall_prompts: Prisma.JsonValue | null;
        processing_version: string;
    }>;
    getPedagogicalData(contentId: string): Promise<{
        id: string;
        updated_at: Date;
        content_id: string;
        processed_at: Date;
        vocabulary_triage: Prisma.JsonValue | null;
        socratic_questions: Prisma.JsonValue | null;
        quiz_questions: Prisma.JsonValue | null;
        taboo_cards: Prisma.JsonValue | null;
        boss_fight_config: Prisma.JsonValue | null;
        free_recall_prompts: Prisma.JsonValue | null;
        processing_version: string;
    }>;
    recordGameResult(data: Prisma.game_resultsCreateInput): Promise<{
        id: string;
        metadata: Prisma.JsonValue | null;
        content_id: string;
        user_id: string;
        score: number;
        game_type: string;
        played_at: Date;
    }>;
}
