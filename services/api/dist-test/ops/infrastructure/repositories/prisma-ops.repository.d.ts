import { PrismaService } from '../../../prisma/prisma.service';
import { IOpsRepository } from '../../domain/interfaces/ops.repository.interface';
export declare class PrismaOpsRepository implements IOpsRepository {
    private prisma;
    constructor(prisma: PrismaService);
    getDailyMinutesSpent(userId: string, date: Date): Promise<number>;
    getLessonsCompletedCount(userId: string, date: Date): Promise<number>;
    getUserPolicy(userId: string): Promise<any>;
    calculateStreak(userId: string): Promise<number>;
    logStudyTime(userId: string, minutes: number): Promise<void>;
}
