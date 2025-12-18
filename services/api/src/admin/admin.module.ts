import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminController } from './admin.controller';
import { DashboardController } from './dashboard.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EncryptionService } from './services/encryption.service';
import { SecretService } from './services/secret.service';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '60m' },
    }),
  ],
  controllers: [AdminController, DashboardController],
  providers: [AdminService, EncryptionService, SecretService],
  exports: [AdminService, EncryptionService, SecretService],
})
export class AdminModule {}
