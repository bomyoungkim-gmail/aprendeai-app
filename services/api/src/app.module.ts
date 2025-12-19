import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { QueueModule } from './queue/queue.module';
import { ExtractionModule } from './extraction/extraction.module';
import { ProfileModule } from './profiles/profile.module';
import { SessionsModule } from './sessions/sessions.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GamificationModule } from './gamification/gamification.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AdminModule } from './admin/admin.module';
import { BillingModule} from './billing/billing.module';
import { ObservabilityModule } from './observability/observability.module';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';
// V4 SRS Modules
import { SrsModule } from './srs/srs.module';
import { VocabModule } from './vocab/vocab.module';
import { ReviewModule } from './review/review.module';
// V5 Assets Module
import { AssetsModule } from './assets/assets.module';
// Study Groups Module
import { StudyGroupsModule } from './study-groups/study-groups.module';
// WebSocket Module
import { WebSocketModule } from './websocket/websocket.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    QueueModule, // Global queue service
    BillingModule, // Global billing services
    ObservabilityModule, // Must be imported before others to track all requests
    ExtractionModule, // Text extraction for Cornell Reader
    ProfileModule, // V3 Learner profiles
    SessionsModule, // V3 Study sessions
    GamificationModule,
    AnalyticsModule,
    AdminModule,
    // V4 SRS Modules
    SrsModule,
    VocabModule,
    ReviewModule,
    // V5 Assets Module
    AssetsModule,
    // Study Groups Module
    StudyGroupsModule,
    // WebSocket for real-time
    WebSocketModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
  ],
})
export class AppModule {}
