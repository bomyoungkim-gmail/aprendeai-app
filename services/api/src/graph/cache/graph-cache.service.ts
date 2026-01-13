import { Injectable, Logger, Optional } from "@nestjs/common";
import { RedisService } from "../../common/redis/redis.service";

@Injectable()
export class GraphCacheService {
  private readonly logger = new Logger(GraphCacheService.name);
  private readonly TTL_EDGE_TYPE = 60 * 60 * 24 * 30; // 30 days
  private readonly TTL_UNDECIDED = 60 * 60 * 24 * 7; // 7 days (policy might change)
  private readonly TTL_NODE_MATCH = 60 * 60 * 24; // 1 day

  constructor(@Optional() private readonly redisService: RedisService) {
    if (!this.redisService) {
      this.logger.warn(
        "RedisService not found, caching will be disabled (or use memory fallback)",
      );
    }
  }

  /**
   * Generates a cache key for edge typing
   */
  private getEdgeTypeKey(contentId: string, edgeSignature: string): string {
    return `graph:edge-typing:${contentId}:${edgeSignature}`;
  }

  /**
   * Generates a cache key for undecided resolution
   */
  private getUndecidedKey(contentId: string, diffSignature: string): string {
    return `graph:undecided:${contentId}:${diffSignature}`;
  }

  /**
   * Generates a cache key for node matching
   */
  private getNodeMatchKey(slug: string, targetGraphId: string): string {
    return `graph:node-match:${targetGraphId}:${slug}`;
  }

  /**
   * Get cached edge type result
   */
  async getEdgeType(
    contentId: string,
    edgeSignature: string,
  ): Promise<string | null> {
    if (!this.redisService) return null;
    const key = this.getEdgeTypeKey(contentId, edgeSignature);
    try {
      const cached = (await this.redisService.get(key)) as unknown as string;
      if (cached) {
        this.logger.debug(`Cache HIT for edge type: ${key}`);
        return cached;
      }
    } catch (error) {
      this.logger.error(`Redis error getEdgeType: ${error}`);
    }
    return null;
  }

  /**
   * Set cached edge type result
   */
  async setEdgeType(
    contentId: string,
    edgeSignature: string,
    value: string,
  ): Promise<void> {
    if (!this.redisService) return;
    const key = this.getEdgeTypeKey(contentId, edgeSignature);
    try {
      await this.redisService.set(key, value, this.TTL_EDGE_TYPE);
    } catch (error) {
      this.logger.error(`Redis error setEdgeType: ${error}`);
    }
  }

  /**
   * Get cached undecided resolution
   */
  async getUndecidedResolution(
    contentId: string,
    diffSignature: string,
  ): Promise<any | null> {
    if (!this.redisService) return null;
    const key = this.getUndecidedKey(contentId, diffSignature);
    try {
      const cached = (await this.redisService.get(key)) as unknown as string;
      if (cached) {
        // Check if it's already an object (if mock returned object) or string
        if (typeof cached === "object") return cached;
        return JSON.parse(cached);
      }
    } catch (error) {
      this.logger.error(`Redis error getUndecidedResolution: ${error}`);
    }
    return null;
  }

  /**
   * Set cached undecided resolution
   */
  async setUndecidedResolution(
    contentId: string,
    diffSignature: string,
    value: any,
  ): Promise<void> {
    if (!this.redisService) return;
    const key = this.getUndecidedKey(contentId, diffSignature);
    try {
      await this.redisService.set(
        key,
        JSON.stringify(value),
        this.TTL_UNDECIDED,
      );
    } catch (error) {
      this.logger.error(`Redis error setUndecidedResolution: ${error}`);
    }
  }

  /**
   * Get cached learner graph visualization
   */
  async getVisualization(
    userId: string,
    contentId: string,
  ): Promise<any | null> {
    if (!this.redisService) return null;
    const key = `graph:learner:${userId}:${contentId}`;
    try {
      const cached = (await this.redisService.get(key)) as unknown as string;
      if (cached) {
        this.logger.log(`Cache HIT for visualization: ${key}`);
        // Check if it's already an object or string
        if (typeof cached === "object") return cached;
        return JSON.parse(cached);
      }
    } catch (error) {
      this.logger.error(`Redis error getVisualization: ${error}`);
    }
    this.logger.debug(
      `Cache MISS for visualization: graph:learner:${userId}:${contentId}`,
    );
    return null;
  }

  /**
   * Set cached learner graph visualization
   * TTL: 5 minutes (300 seconds)
   */
  async setVisualization(
    userId: string,
    contentId: string,
    value: any,
  ): Promise<void> {
    if (!this.redisService) return;
    const key = `graph:learner:${userId}:${contentId}`;
    const TTL_VISUALIZATION = 60 * 5; // 5 minutes
    try {
      await this.redisService.set(
        key,
        JSON.stringify(value),
        TTL_VISUALIZATION,
      );
      this.logger.log(`Cached visualization: ${key}`);
    } catch (error) {
      this.logger.error(`Redis error setVisualization: ${error}`);
    }
  }

  /**
   * Invalidate cached learner graph visualization
   * Call this when user creates highlights, edges, or status changes
   */
  async invalidateVisualization(
    userId: string,
    contentId: string,
  ): Promise<void> {
    if (!this.redisService) return;
    const key = `graph:learner:${userId}:${contentId}`;
    try {
      await this.redisService.del(key);
      this.logger.log(`Invalidated visualization cache: ${key}`);
    } catch (error) {
      this.logger.error(`Redis error invalidateVisualization: ${error}`);
    }
  }
}
