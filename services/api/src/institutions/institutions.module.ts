import { Module } from '@nestjs/common';
import { InstitutionsController } from './institutions.controller';
import { InstitutionsService } from './institutions.service';
import { InstitutionInviteService } from './institution-invite.service';
import { InstitutionDomainService } from './institution-domain.service';
import { ApprovalService } from './approval.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [PrismaModule, EmailModule, AdminModule],
  controllers: [InstitutionsController],
  providers: [
    InstitutionsService,
    InstitutionInviteService,
    InstitutionDomainService,
    ApprovalService,
    SSOService,
  ],
  exports: [
    InstitutionsService,
    InstitutionInviteService,
    InstitutionDomainService,
    ApprovalService,
  ],
})
export class InstitutionsModule {}
