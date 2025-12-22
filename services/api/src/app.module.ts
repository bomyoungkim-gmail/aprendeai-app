import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
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
import { HealthModule } from './health/health.module';
import { AnnotationModule } from './annotations/annotation.module';
// Activity Module
import { ActivityModule } from './activity/activity.module';
// Email Module
import { EmailModule } from './email/email.module';
import { RecommendationModule } from './recommendations/recommendation.module';
import { SearchModule } from './search/search.module';
import { FamilyModule } from './family/family.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { ActionLoggerMiddleware } from './common/middleware/logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'], // .env.local takes precedence for local dev
      cache: false, // Disable caching to ensure fresh values
    }),
    EventEmitterModule.forRoot({ global: true }),
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
    HealthModule,
    ActivityModule, // Activity tracking & heatmap
    EmailModule, // Email notifications
    RecommendationModule,
    SearchModule,
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
    // Collaborative Annotations
    AnnotationModule,
    // Auth Module (Authentication & Authorization)
    AuthModule,
    // Family Plan
    FamilyModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,  // Global authentication - all routes protected by default
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware, ActionLoggerMiddleware)
      .forRoutes('*');
  }
}
