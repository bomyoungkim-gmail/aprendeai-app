import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { EmailService } from "./email.service";
import { EmailProcessor } from "./email.processor";
import { EmailController } from "./email.controller";
import { UnsubscribeUserUseCase } from "./application/use-cases/unsubscribe-user.use-case";
import { UsersModule } from "../users/users.module";
import { PrismaModule } from "../prisma/prisma.module";
import { EmailWorker } from "../workers/email.worker";
import { FamilyModule } from "../family/family.module";

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    FamilyModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get("JWT_SECRET"),
        signOptions: { expiresIn: "30d" },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [EmailController],
  providers: [EmailService, EmailProcessor, EmailWorker, UnsubscribeUserUseCase],
  exports: [EmailService],
})
export class EmailModule {}
