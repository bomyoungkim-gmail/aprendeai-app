import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { ValidationPipe, Logger } from "@nestjs/common";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import * as Sentry from "@sentry/node";
import { join, normalize } from "path";
import { existsSync, mkdirSync } from "fs";
import { URL_CONFIG } from "./config/urls.config";
import { json, urlencoded } from "express";
import * as cookieParser from "cookie-parser";

async function bootstrap() {
  // Fix BigInt JSON serialization - Required for integration tests
  // @ts-ignore
  BigInt.prototype.toJSON = function () {
    return this.toString();
  };

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger("Bootstrap");

  // Set global prefix for all routes (versioning)
  app.setGlobalPrefix("api/v1");
  logger.log("🌐 Global prefix set to /api/v1");

  // Enable cookie parser for HTTP-only cookies
  app.use(cookieParser());
  logger.log("🍪 Cookie parser enabled");

  // Increase payload limit
  app.use(json({ limit: "50mb" }));
  app.use(urlencoded({ extended: true, limit: "50mb" }));

  // Static file serving for uploaded media
  const uploadsDir = process.env.UPLOADS_DIR ?? join(process.cwd(), "uploads");
  if (process.env.NODE_ENV !== "production" && !existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
    logger.log(`📁 Created uploads directory: ${uploadsDir}`);
  }
  app.useStaticAssets(normalize(uploadsDir), {
    prefix: "/api/uploads/",
  });
  logger.log(`📦 Static assets serving at /api/uploads/ → ${uploadsDir}`);

  // Initialize Sentry for error tracking
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || "development",
      tracesSampleRate: 1.0,
    });
    logger.log("Sentry initialized");
  }

  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Setup Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle("AprendeAI Admin Console API")
    .setDescription(
      `
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
    `,
    )
    .setVersion("2.0.0")
    .setContact(
      "AprendeAI Team",
      "https://aprendeai.com",
      "support@aprendeai.com",
    )
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
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter JWT token from /admin/login",
      },
      "JWT-auth",
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document, {
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

  // Enable CORS for frontend - Ultra-robust for local development
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      const isDevelopment = process.env.NODE_ENV !== "production";
      const allowedOrigins = URL_CONFIG.corsOrigins;

      if (
        allowedOrigins.includes(origin) ||
        (isDevelopment &&
          (origin.includes("localhost:3000") ||
            origin.includes("127.0.0.1:3000")))
      ) {
        callback(null, true);
      } else {
        logger.error(`🚫 CORS blocked for origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`🚀 API running on http://localhost:${port}`);
  logger.log(`📚 API Docs: http://localhost:${port}/api/docs`);
}

bootstrap();
