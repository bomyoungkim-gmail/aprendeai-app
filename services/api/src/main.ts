import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Standard CORS setup for dev
  await app.listen(4000);
  console.log("API is running on http://localhost:4000");
}
bootstrap();
