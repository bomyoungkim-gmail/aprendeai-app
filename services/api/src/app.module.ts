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
import { CornellModule } from './cornell/cornell.module';
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
import { ClassroomModule } from './classroom/classroom.module';
import { OpsModule } from './ops/ops.module';
import { WebClipsModule } from './webclips/webclips.module';
import { GamesModule } from './games/games.module';
import { InstitutionsModule } from './institutions/institutions.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { ActionLoggerMiddleware } from './common/middleware/logger.middleware';
import { RouteValidationMiddleware } from './common/middleware/route-validation.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' 
        ? ['.env.test', '.env.local', '.env'] 
        : ['.env.local', '.env'], // .env.local takes precedence for local dev
      cache: false, // Disable caching to ensure fresh values
      // Add default test values
      load: [() => ({
        JWT_SECRET: process.env.JWT_SECRET || 'test-jwt-secret-key-change-in-production',
        DATABASE_URL: process.env.DATABASE_URL,
        NODE_ENV: process.env.NODE_ENV || 'development',
      })],
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
    CornellModule,
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
    // Classroom Mode
    ClassroomModule,
    // OpsCoach
    OpsModule,
    // Browser Extension WebClips
    WebClipsModule,
    // AI Games Module
    GamesModule,
    // Institutional Registration
    InstitutionsModule,
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
      .apply(RequestIdMiddleware, RouteValidationMiddleware, ActionLoggerMiddleware)
      .forRoutes('*');
  }
}
