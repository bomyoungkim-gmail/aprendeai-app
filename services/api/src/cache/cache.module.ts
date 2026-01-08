import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    NestCacheModule.register({
      store: redisStore as any,
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      ttl: 300, // 5 minutes default
      max: 100, // Maximum number of items in cache
    }),
  ],
  exports: [NestCacheModule],
})
export class CacheModule {}
