"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const global_exception_filter_1 = require("./common/filters/global-exception.filter");
const swagger_1 = require("@nestjs/swagger");
const Sentry = require("@sentry/node");
const path_1 = require("path");
const fs_1 = require("fs");
const urls_config_1 = require("./config/urls.config");
const express_1 = require("express");
async function bootstrap() {
    var _a;
    BigInt.prototype.toJSON = function () {
        return this.toString();
    };
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const logger = new common_1.Logger("Bootstrap");
    app.setGlobalPrefix("api/v1");
    logger.log("🌐 Global prefix set to /api/v1");
    app.use((0, express_1.json)({ limit: "50mb" }));
    app.use((0, express_1.urlencoded)({ extended: true, limit: "50mb" }));
    const uploadsDir = (_a = process.env.UPLOADS_DIR) !== null && _a !== void 0 ? _a : (0, path_1.join)(process.cwd(), "uploads");
    if (process.env.NODE_ENV !== "production" && !(0, fs_1.existsSync)(uploadsDir)) {
        (0, fs_1.mkdirSync)(uploadsDir, { recursive: true });
        logger.log(`📁 Created uploads directory: ${uploadsDir}`);
    }
    app.useStaticAssets((0, path_1.normalize)(uploadsDir), {
        prefix: "/api/uploads/",
    });
    logger.log(`📦 Static assets serving at /api/uploads/ → ${uploadsDir}`);
    if (process.env.SENTRY_DSN) {
        Sentry.init({
            dsn: process.env.SENTRY_DSN,
            environment: process.env.NODE_ENV || "development",
            tracesSampleRate: 1.0,
        });
        logger.log("Sentry initialized");
    }
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.useGlobalFilters(new global_exception_filter_1.GlobalExceptionFilter());
    const config = new swagger_1.DocumentBuilder()
        .setTitle("AprendeAI Admin Console API")
        .setDescription(`
      **Enterprise-grade Admin Console API**
      
      Features:
      - 🔐 RBAC (Role-Based Access Control)
      - 🔒 AES-256-GCM Encryption
      - 👥 User Management & Impersonation
      - 🚩 Feature Flags
      - 🔑 Secret Management
      - 📊 Observability & Metrics
      - ⚙️ Configuration Management
      - 📝 Complete Audit Trail
      
      Authentication: Bearer JWT token required for all admin endpoints.
    `)
        .setVersion("2.0.0")
        .setContact("AprendeAI Team", "https://aprendeai.com", "support@aprendeai.com")
        .setLicense("MIT", "https://opensource.org/licenses/MIT")
        .addTag("auth", "Authentication & Authorization")
        .addTag("admin", "Admin Core (RBAC & Audit)")
        .addTag("admin-users", "User Management & Impersonation")
        .addTag("admin-secrets", "Encrypted Secrets Management")
        .addTag("admin-feature-flags", "Feature Flags & Toggles")
        .addTag("admin-audit", "Audit Logs & Compliance")
        .addTag("admin-dashboard", "Observability & Metrics")
        .addTag("admin-config", "Configuration & Integrations")
        .addTag("gamification", "Gamification & Achievements")
        .addBearerAuth({
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter JWT token from /admin/login",
    }, "JWT-auth")
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup("api/docs", app, document, {
        customSiteTitle: "AprendeAI API Docs",
        customCss: ".swagger-ui .topbar { display: none }",
        swaggerOptions: {
            persistAuthorization: true,
            docExpansion: "none",
            filter: true,
            tagsSorter: "alpha",
        },
    });
    logger.log("📚 Swagger documentation available at /api/docs");
    app.enableCors({
        origin: urls_config_1.URL_CONFIG.corsOrigins,
        credentials: true,
    });
    const port = process.env.PORT || 4000;
    await app.listen(port);
    logger.log(`🚀 API running on http://localhost:${port}`);
    logger.log(`📚 API Docs: http://localhost:${port}/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map