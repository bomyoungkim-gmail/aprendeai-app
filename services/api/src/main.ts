import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe, Logger } from "@nestjs/common";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import * as Sentry from "@sentry/node";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Initialize Sentry for error tracking
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: 1.0,
    });
    logger.log('Sentry initialized');
  }
  
  // Enable validation globally
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // Enable global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());
  
  // Setup Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('AprendeAI API')
    .setDescription('Educational platform API for reading and vocabulary enhancement')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('content', 'Content management')
    .addTag('gamification', 'Gamification features')
    .addTag('analytics', 'Analytics and progress tracking')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  logger.log('Swagger documentation available at /api/docs');
  
  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://aprendeai.com']
      : ['http://localhost:3000'],
    credentials: true,
  });
  
  await app.listen(4000);
  logger.log("API is running on http://localhost:4000");
  logger.log("API Docs: http://localhost:4000/api/docs");
}
bootstrap();
