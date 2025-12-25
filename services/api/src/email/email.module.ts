import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { EmailService } from "./email.service";
import { EmailProcessor } from "./email.processor";
import { EmailController } from "./email.controller";
import { PrismaModule } from "../prisma/prisma.module";

import { EmailWorker } from "../workers/email.worker";

@Module({
  imports: [
    PrismaModule,
    // BullModule temporarily disabled for local dev without Redis
    // BullModule.registerQueue({
    //   name: 'email',
    //   connection: {
    //     host: process.env.REDIS_HOST || 'localhost',
    //     port: parseInt(process.env.REDIS_PORT || '6379'),
    //   },
    // }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get("JWT_SECRET"),
        signOptions: { expiresIn: "30d" }, // Long expiry for unsubscribe links
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [EmailController],
  providers: [EmailService, EmailProcessor, EmailWorker],
  exports: [EmailService],
})
export class EmailModule {}
