import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class GraphCacheService {
  private readonly logger = new Logger(GraphCacheService.name);
  private readonly TTL_EDGE_TYPE = 60 * 60 * 24 * 30; // 30 days
  private readonly TTL_UNDECIDED = 60 * 60 * 24 * 7; // 7 days (policy might change)
  private readonly TTL_NODE_MATCH = 60 * 60 * 24; // 1 day

  constructor(
    @Optional() private readonly redisService: RedisService,
  ) {
    if (!this.redisService) {
      this.logger.warn('RedisService not found, caching will be disabled (or use memory fallback)');
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
  async getEdgeType(contentId: string, edgeSignature: string): Promise<string | null> {
    if (!this.redisService) return null;
    const key = this.getEdgeTypeKey(contentId, edgeSignature);
    try {
      const cached = await this.redisService.get(key) as unknown as string;
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
  async setEdgeType(contentId: string, edgeSignature: string, value: string): Promise<void> {
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
  async getUndecidedResolution(contentId: string, diffSignature: string): Promise<any | null> {
    if (!this.redisService) return null;
    const key = this.getUndecidedKey(contentId, diffSignature);
    try {
      const cached = await this.redisService.get(key) as unknown as string;
      if (cached) {
          // Check if it's already an object (if mock returned object) or string
          if (typeof cached === 'object') return cached;
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
  async setUndecidedResolution(contentId: string, diffSignature: string, value: any): Promise<void> {
    if (!this.redisService) return;
    const key = this.getUndecidedKey(contentId, diffSignature);
    try {
        await this.redisService.set(key, JSON.stringify(value), this.TTL_UNDECIDED);
    } catch (error) {
       this.logger.error(`Redis error setUndecidedResolution: ${error}`);
    }
  }
}
