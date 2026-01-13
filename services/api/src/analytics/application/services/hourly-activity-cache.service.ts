import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class HourlyActivityCacheService {
  private readonly logger = new Logger(HourlyActivityCacheService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getCachedData(userId: string, period: "30d" | "360d") {
    return this.prisma.hourly_activity_cache.findMany({
      where: {
        user_id: userId,
        period: period,
      },
      orderBy: {
        time_slot: "asc",
      },
    });
  }

  async rebuildCacheForUser(userId: string, period: "30d" | "360d") {
    const days = period === "30d" ? 30 : 360;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const rawData = await this.prisma.$queryRaw<any[]>`
      WITH time_slots AS (
        SELECT 
          generate_series(
            date_trunc('hour', start_time),
            date_trunc('hour', COALESCE(end_time, start_time + interval '2 hours')),
            interval '30 minutes'
          ) AS slot_start,
          start_time,
          COALESCE(end_time, start_time + interval '2 hours') AS end_time
        FROM study_sessions
        WHERE user_id = ${userId}::uuid
          AND start_time >= ${since}
          AND duration_minutes IS NOT NULL
      ),
      minutes_per_slot AS (
        SELECT 
          EXTRACT(HOUR FROM slot_start)::integer AS hour,
          EXTRACT(MINUTE FROM slot_start)::integer AS minute,
          EXTRACT(EPOCH FROM (
            LEAST(slot_start + interval '30 minutes', end_time) - 
            GREATEST(slot_start, start_time)
          )) / 60 AS minutes_in_slot
        FROM time_slots
      )
      SELECT 
        CASE 
          WHEN minute = 0 THEN hour || ':00'
          ELSE hour || ':30'
        END AS time_slot,
        SUM(minutes_in_slot)::integer AS total_minutes
      FROM minutes_per_slot
      GROUP BY hour, minute
      ORDER BY hour, minute
    `;

    await this.prisma.$transaction(async (tx) => {
      await tx.hourly_activity_cache.deleteMany({
        where: { user_id: userId, period },
      });

      if (rawData.length > 0) {
        await tx.hourly_activity_cache.createMany({
          data: rawData.map((row) => ({
            user_id: userId,
            period,
            time_slot: row.time_slot,
            minutes: row.total_minutes,
            last_updated: new Date(),
          })),
        });
      }
    });

    this.logger.log(`Cache rebuilt for user ${userId} period ${period}`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async rebuildCacheForAllUsers() {
    this.logger.log("Starting daily cache rebuild...");

    const activeUsers = await this.prisma.study_sessions.findMany({
      where: {
        start_time: {
          gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        },
      },
      select: { user_id: true },
      distinct: ["user_id"],
    });

    this.logger.log(`Found ${activeUsers.length} active users to update.`);

    for (const user of activeUsers) {
      try {
        await this.rebuildCacheForUser(user.user_id, "30d");
        await this.rebuildCacheForUser(user.user_id, "360d");
      } catch (error) {
        this.logger.error(
          `Failed to rebuild cache for user ${user.user_id}: ${error.message}`,
        );
      }
    }

    this.logger.log("Daily cache rebuild completed.");
  }
}
