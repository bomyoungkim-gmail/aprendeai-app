/**
 * Export Swagger/OpenAPI JSON
 * 
 * This script initializes the NestJS application context (without listening on a port)
 * generates the Swagger document using decorators metadata, and saves it to a JSON file.
 * 
 * Usage:
 *   npx ts-node scripts/export-swagger.ts
 */

import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../services/api/src/app.module';
import * as fs from 'fs';
import * as path from 'path';

async function generateSwagger() {
  // Create NestJS app context (standalone)
  const app = await NestFactory.create(AppModule, { logger: false });

  // Swagger Configuration (must match main.ts)
  const config = new DocumentBuilder()
    .setTitle('AprendeAI API')
    .setDescription('API documentation for AprendeAI Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  // Generate Document
  const document = SwaggerModule.createDocument(app, config);

  // Define output path
  const outputPath = path.join(__dirname, '..', 'docs', 'REFERENCE', 'openapi.json');
  
  // Create directory if not exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write file
  fs.writeFileSync(outputPath, JSON.stringify(document, null, 2));
  
  console.log(`✅ OpenAPI spec exported to: ${outputPath}`);

  await app.close();
  process.exit(0);
}

generateSwagger().catch((err) => {
  console.error('❌ Failed to generate Swagger:', err);
  process.exit(1);
});
