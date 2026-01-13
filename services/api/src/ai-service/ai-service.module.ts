import { Module, Global } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { AiServiceClient } from "./ai-service.client";
import { AiRateLimiterService } from "./ai-rate-limiter.service";
import { PrismaModule } from "../prisma/prisma.module";
import { RedisModule } from "../common/redis/redis.module";

@Global()
@Module({
  imports: [HttpModule, PrismaModule, RedisModule],
  providers: [AiServiceClient, AiRateLimiterService],
  exports: [AiServiceClient, AiRateLimiterService],
})
export class AiServiceModule {}
