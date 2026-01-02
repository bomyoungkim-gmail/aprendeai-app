import { Module } from "@nestjs/common";
import { CacheModule } from "@nestjs/cache-manager";
import { PrismaModule } from "../prisma/prisma.module";
import { ContentAccessService } from "./services/content-access.service";
import { cacheConfig } from "../config/cache.config";

@Module({
  imports: [PrismaModule, CacheModule.register(cacheConfig)],
  providers: [ContentAccessService],
  exports: [ContentAccessService],
})
export class ContentAccessModule {}
