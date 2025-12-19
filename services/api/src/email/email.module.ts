import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { EmailProcessor } from './email.processor';
import { EmailController } from './email.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'email',
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '30d' }, // Long expiry for unsubscribe links
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [EmailController],
  providers: [EmailService, EmailProcessor],
  exports: [EmailService],
})
export class EmailModule {}
