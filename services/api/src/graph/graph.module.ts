import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
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
// GRAPH SCRIPT 19.10: Temporal Decay
import { GraphDecayService } from './decay/graph-decay.service';
import { GraphDecayJob } from './jobs/graph-decay.job';
import { GraphReinforcementListener } from './listeners/graph-reinforcement.listener';
// GRAPH SCRIPT 19.8: Baseline Auto-Trigger
import { ContentBaselineListener } from './listeners/content-baseline.listener';
// GRAPH SCRIPT 19.9: Periodic Comparison
import { GraphComparisonJob } from './jobs/graph-comparison.job';
import { GraphActivityListener } from './listeners/graph-activity.listener';
// Health monitoring
import { GraphHealthService } from './health/graph-health.service';
import { GraphHealthController } from './health/graph-health.controller';
// Metrics for Grafana
import { GraphMetricsService } from './metrics/graph-metrics.service';
import { GraphMetricsController } from './metrics/graph-metrics.controller';
// Adaptive features
import { ThresholdOptimizerService } from './adaptive/threshold-optimizer.service';
// Graph Diff
import { GraphDiffService } from './diff/graph-diff.service';
import { GraphDiffController } from './diff/graph-diff.controller';
// ML features
import { DecayPredictorService } from './ml/decay-predictor.service';

@Module({
  imports: [
    PrismaModule,
    TelemetryModule,
    ScheduleModule.forRoot(), // Enable cron jobs
  ],
  controllers: [
    GraphLearnerController,
    GraphBaselineController,
    GraphComparatorController,
    GraphCuratorController,
    DeterministicSourceController,
    GraphRecommendationController,
    GraphBackfillController,
    GraphHealthController,
    GraphMetricsController,
    GraphDiffController,
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
    // GRAPH SCRIPT 19.10: Temporal Decay
    GraphDecayService,
    GraphDecayJob,
    GraphReinforcementListener,
    // GRAPH SCRIPT 19.8: Baseline Auto-Trigger
    ContentBaselineListener,
    // GRAPH SCRIPT 19.9: Periodic Comparison
    GraphComparisonJob,
    GraphActivityListener,
    // Health monitoring
    GraphHealthService,
    // Metrics for Grafana
    GraphMetricsService,
    // Adaptive features
    ThresholdOptimizerService,
    // Graph Diff
    GraphDiffService,
    // ML features
    DecayPredictorService,
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
    GraphDecayService, // Export for use in other modules
  ],
})
export class GraphModule {}
