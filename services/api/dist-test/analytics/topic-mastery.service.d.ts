import { PrismaService } from "../prisma/prisma.service";
export declare class TopicMasteryService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    updateMastery(userId: string, topic: string, subject: string, isCorrect: boolean, timeSpentSeconds?: number): Promise<void>;
    getUserMastery(userId: string): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        subject: string;
        streak: number;
        user_id: string;
        topic: string;
        mastery_level: number;
        questions_attempted: number;
        questions_correct: number;
        time_spent: number;
        last_activity_at: Date;
    }[]>;
    getWeakestTopics(userId: string, limit?: number): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        subject: string;
        streak: number;
        user_id: string;
        topic: string;
        mastery_level: number;
        questions_attempted: number;
        questions_correct: number;
        time_spent: number;
        last_activity_at: Date;
    }[]>;
}
