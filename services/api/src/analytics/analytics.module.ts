import { Module } from "@nestjs/common";
import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";
import { PrismaModule } from "../prisma/prisma.module";

import { TokenAnalyticsService } from "./token-analytics.service";

@Module({
  imports: [PrismaModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, TokenAnalyticsService],
  exports: [TokenAnalyticsService],
})
export class AnalyticsModule {}
