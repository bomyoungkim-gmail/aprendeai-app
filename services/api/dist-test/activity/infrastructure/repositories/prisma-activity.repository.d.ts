import { PrismaService } from '../../../prisma/prisma.service';
import { IActivityRepository } from '../../domain/interfaces/activity.repository.interface';
import { Activity } from '../../domain/entities/activity.entity';
export declare class PrismaActivityRepository implements IActivityRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    track(userId: string, date: Date, data: Partial<Omit<Activity, 'id' | 'userId' | 'date'>>): Promise<void>;
    getActivityHeatmap(userId: string, days: number): Promise<Activity[]>;
    getActivities(userId: string, since: Date): Promise<Activity[]>;
    getActiveTopicsCount(userId: string, since: Date): Promise<number>;
}
