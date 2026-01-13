import { Injectable, Logger } from "@nestjs/common";
import { RedisService } from "../common/redis/redis.service";

/**
 * SCRIPT 10: Rate Limiter Service
 *
 * Implements sliding window rate limiting using Redis.
 * Prevents LLM abuse by enforcing per-minute request limits.
 */
@Injectable()
export class AiRateLimiterService {
  private readonly logger = new Logger(AiRateLimiterService.name);

  constructor(private readonly redis: RedisService) {}

  /**
   * Check if a scope (family/institution) has exceeded its rate limit
   *
   * @param scopeId - The scope identifier (family_id or institution_id)
   * @param limit - Maximum requests per minute
   * @returns true if under limit, false if exceeded
   */
  async checkLimit(scopeId: string, limit: number): Promise<boolean> {
    const now = Date.now();
    const currentMinute = Math.floor(now / 60000); // Minute timestamp
    const key = `ratelimit:${scopeId}:${currentMinute}`;

    try {
      // Increment counter for this minute
      const count = await this.redis.incr(key);

      // Set expiration on first increment (2 minutes to be safe)
      if (count === 1) {
        await this.redis.expire(key, 120);
      }

      const allowed = count <= limit;

      if (!allowed) {
        this.logger.warn(
          `Rate limit exceeded for scope ${scopeId}: ${count}/${limit} requests this minute`,
        );
      }

      return allowed;
    } catch (error) {
      this.logger.error(
        `Rate limiter error for scope ${scopeId}:`,
        error.stack,
      );
      // Fail open: allow request if Redis is down
      return true;
    }
  }

  /**
   * Get current usage for a scope in the current minute
   */
  async getCurrentUsage(scopeId: string): Promise<number> {
    const now = Date.now();
    const currentMinute = Math.floor(now / 60000);
    const key = `ratelimit:${scopeId}:${currentMinute}`;

    try {
      const count = await this.redis.get(key);
      return count ? parseInt(count as string, 10) : 0;
    } catch (error) {
      this.logger.error(
        `Error getting current usage for scope ${scopeId}:`,
        error.stack,
      );
      return 0;
    }
  }
}
