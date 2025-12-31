import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IActivityRepository } from '../../domain/interfaces/activity.repository.interface';
import { Activity } from '../../domain/entities/activity.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PrismaActivityRepository implements IActivityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async track(userId: string, date: Date, data: Partial<Omit<Activity, 'id' | 'userId' | 'date'>>): Promise<void> {
    await this.prisma.daily_activities.upsert({
      where: {
        user_id_date: {
          user_id: userId,
          date: date,
        },
      },
      create: {
        id: uuidv4(),
        user_id: userId,
        date: date,
        minutes_studied: data.minutesStudied || 0,
        sessions_count: data.sessionsCount || 0,
        contents_read: data.contentsRead || 0,
        annotations_created: data.annotationsCreated || 0,
      },
      update: {
        minutes_studied: data.minutesStudied ? { increment: data.minutesStudied } : undefined,
        sessions_count: data.sessionsCount ? { increment: data.sessionsCount } : undefined,
        contents_read: data.contentsRead ? { increment: data.contentsRead } : undefined,
        annotations_created: data.annotationsCreated ? { increment: data.annotationsCreated } : undefined,
      },
    });
  }

  async getActivityHeatmap(userId: string, days: number): Promise<Activity[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const activities = await this.prisma.daily_activities.findMany({
      where: {
        user_id: userId,
        date: { gte: startDate },
      },
      orderBy: { date: 'asc' },
    });

    return activities.map(a => new Activity(
      a.id,
      a.user_id,
      a.date,
      a.minutes_studied,
      a.sessions_count,
      a.contents_read,
      a.annotations_created
    ));
  }

  async getActivities(userId: string, since: Date): Promise<Activity[]> {
    const activities = await this.prisma.daily_activities.findMany({
      where: {
        user_id: userId,
        date: { gte: since },
      },
      orderBy: { date: 'desc' },
    });

    return activities.map(a => new Activity(
      a.id,
      a.user_id,
      a.date,
      a.minutes_studied,
      a.sessions_count,
      a.contents_read,
      a.annotations_created
    ));
  }

  async getActiveTopicsCount(userId: string, since: Date): Promise<number> {
    const topics = await this.prisma.user_topic_mastery.findMany({
      where: {
        user_id: userId,
        last_activity_at: { gte: since },
      },
      select: { topic: true },
      distinct: ['topic'],
    });

    return topics.length;
  }
}
