"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_module_1 = require("./prisma/prisma.module");
const queue_module_1 = require("./queue/queue.module");
const extraction_module_1 = require("./extraction/extraction.module");
const profile_module_1 = require("./profiles/profile.module");
const sessions_module_1 = require("./sessions/sessions.module");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const gamification_module_1 = require("./gamification/gamification.module");
const analytics_module_1 = require("./analytics/analytics.module");
const admin_module_1 = require("./admin/admin.module");
const billing_module_1 = require("./billing/billing.module");
const observability_module_1 = require("./observability/observability.module");
const metrics_interceptor_1 = require("./common/interceptors/metrics.interceptor");
const srs_module_1 = require("./srs/srs.module");
const vocab_module_1 = require("./vocab/vocab.module");
const review_module_1 = require("./review/review.module");
const assets_module_1 = require("./assets/assets.module");
const cornell_module_1 = require("./cornell/cornell.module");
const study_groups_module_1 = require("./study-groups/study-groups.module");
const websocket_module_1 = require("./websocket/websocket.module");
const health_module_1 = require("./health/health.module");
const annotation_module_1 = require("./annotations/annotation.module");
const activity_module_1 = require("./activity/activity.module");
const email_module_1 = require("./email/email.module");
const recommendation_module_1 = require("./recommendations/recommendation.module");
const search_module_1 = require("./search/search.module");
const family_module_1 = require("./family/family.module");
const classroom_module_1 = require("./classroom/classroom.module");
const sharing_module_1 = require("./sharing/sharing.module");
const ops_module_1 = require("./ops/ops.module");
const webclips_module_1 = require("./webclips/webclips.module");
const games_module_1 = require("./games/games.module");
const institutions_module_1 = require("./institutions/institutions.module");
const content_classification_module_1 = require("./content-classification/content-classification.module");
const assessment_module_1 = require("./assessment/assessment.module");
const auth_module_1 = require("./auth/auth.module");
const jwt_auth_guard_1 = require("./auth/infrastructure/jwt-auth.guard");
const common_2 = require("@nestjs/common");
const request_id_middleware_1 = require("./common/middleware/request-id.middleware");
const logger_middleware_1 = require("./common/middleware/logger.middleware");
const route_validation_middleware_1 = require("./common/middleware/route-validation.middleware");
const notifications_module_1 = require("./notifications/notifications.module");
const session_tracking_module_1 = require("./analytics/session-tracking.module");
const serve_static_1 = require("@nestjs/serve-static");
const path_1 = require("path");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(request_id_middleware_1.RequestIdMiddleware, logger_middleware_1.ActionLoggerMiddleware).forRoutes("*");
        consumer
            .apply(route_validation_middleware_1.RouteValidationMiddleware)
            .exclude({ path: "auth/(.*)", method: common_2.RequestMethod.ALL }, { path: "health", method: common_2.RequestMethod.ALL }, { path: "api/v1/health", method: common_2.RequestMethod.ALL })
            .forRoutes("*");
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: process.env.NODE_ENV === "test"
                    ? [".env.test", ".env.local", ".env"]
                    : [".env.local", ".env"],
                cache: false,
                load: [
                    () => ({
                        JWT_SECRET: process.env.JWT_SECRET ||
                            "test-jwt-secret-key-change-in-production",
                        DATABASE_URL: process.env.DATABASE_URL,
                        NODE_ENV: process.env.NODE_ENV || "development",
                    }),
                ],
            }),
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(process.cwd(), "uploads"),
                serveRoot: "/api/uploads",
            }),
            event_emitter_1.EventEmitterModule.forRoot({ global: true }),
            prisma_module_1.PrismaModule,
            queue_module_1.QueueModule,
            billing_module_1.BillingModule,
            observability_module_1.ObservabilityModule,
            extraction_module_1.ExtractionModule,
            profile_module_1.ProfileModule,
            sessions_module_1.SessionsModule,
            gamification_module_1.GamificationModule,
            analytics_module_1.AnalyticsModule,
            admin_module_1.AdminModule,
            health_module_1.HealthModule,
            activity_module_1.ActivityModule,
            email_module_1.EmailModule,
            recommendation_module_1.RecommendationModule,
            search_module_1.SearchModule,
            srs_module_1.SrsModule,
            vocab_module_1.VocabModule,
            review_module_1.ReviewModule,
            assets_module_1.AssetsModule,
            cornell_module_1.CornellModule,
            study_groups_module_1.StudyGroupsModule,
            websocket_module_1.WebSocketModule,
            annotation_module_1.AnnotationModule,
            auth_module_1.AuthModule,
            family_module_1.FamilyModule,
            classroom_module_1.ClassroomModule,
            sharing_module_1.SharingModule,
            ops_module_1.OpsModule,
            webclips_module_1.WebClipsModule,
            games_module_1.GamesModule,
            institutions_module_1.InstitutionsModule,
            content_classification_module_1.ContentClassificationModule,
            assessment_module_1.AssessmentModule,
            notifications_module_1.NotificationsModule,
            session_tracking_module_1.SessionTrackingModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: metrics_interceptor_1.MetricsInterceptor,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map