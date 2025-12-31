import { Activity, ActivityStats } from '../entities/activity.entity';

export interface IActivityRepository {
  track(userId: string, date: Date, data: Partial<Omit<Activity, 'id' | 'userId' | 'date'>>): Promise<void>;
  getActivityHeatmap(userId: string, days: number): Promise<Activity[]>;
  getActivities(userId: string, since: Date): Promise<Activity[]>;
  getActiveTopicsCount(userId: string, since: Date): Promise<number>;
}

export const IActivityRepository = Symbol("IActivityRepository");
