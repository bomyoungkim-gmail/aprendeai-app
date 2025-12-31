import type { CacheModuleOptions } from "@nestjs/cache-manager";

export const cacheConfig: CacheModuleOptions = {
  ttl: 5 * 60 * 1000, // 5 minutes default
  max: 1000, // Max 1000 items in memory (LRU eviction)
  isGlobal: true, // Make cache available globally
};
