import { Module } from '@nestjs/common';
import { GraphLearnerService } from './application/graph-learner.service';
import { GraphLearnerController } from './presentation/graph-learner.controller';
import { GraphBaselineService } from './baseline/graph-baseline.service';
import { GraphBaselineController } from './baseline/graph-baseline.controller';
import { GraphComparatorService } from './comparator/graph-comparator.service';
import { GraphComparatorController } from './comparator/graph-comparator.controller';
import { GraphCuratorService } from './curator/graph-curator.service';
import { GraphCuratorController } from './curator/graph-curator.controller';
import { DeterministicSourceService } from './deterministic/deterministic-source.service';
import { DeterministicSourceController } from './deterministic/deterministic-source.controller';
import { TopicLinkingService } from './registry/topic-linking.service';
import { GraphRecommendationService } from './recommendation/graph-recommendation.service';
import { GraphRecommendationController } from './recommendation/graph-recommendation.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TelemetryModule } from '../telemetry/telemetry.module';
import { GraphCacheService } from './cache/graph-cache.service';
import { RedisService } from '../common/redis/redis.service';
import { GraphBackfillService } from './admin/graph-backfill.service';
import { GraphBackfillController } from './admin/graph-backfill.controller';

@Module({
  imports: [PrismaModule, TelemetryModule],
  controllers: [
    GraphLearnerController,
    GraphBaselineController,
    GraphComparatorController,
    GraphCuratorController,
    DeterministicSourceController,
    GraphRecommendationController,
    GraphBackfillController,
  ],
  providers: [
    GraphLearnerService,
    GraphBaselineService,
    GraphComparatorService,
    GraphCuratorService,
    DeterministicSourceService,
    TopicLinkingService,
    GraphRecommendationService,
    GraphCacheService,
    RedisService,
    GraphBackfillService,
  ],
  exports: [
    GraphLearnerService,
    GraphBaselineService,
    GraphComparatorService,
    GraphCuratorService,
    DeterministicSourceService,
    TopicLinkingService,
    GraphRecommendationService,
    GraphCacheService,
    GraphBackfillService,
  ],
})
export class GraphModule {}
