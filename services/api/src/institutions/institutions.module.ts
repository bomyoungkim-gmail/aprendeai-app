import { Module } from "@nestjs/common";
import { InstitutionsService } from "./institutions.service";
import { InstitutionsController } from "./institutions.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { EmailModule } from "../email/email.module";
import { AdminModule } from "../admin/admin.module";
import { BillingModule } from "../billing/billing.module";
import { ApprovalService } from "./approval.service";
import { InstitutionInviteService } from "./institution-invite.service";
import { InstitutionDomainService } from "./institution-domain.service";
import { SSOService } from "./sso.service";
import { UsersModule } from "../users/users.module";
import { BulkService } from "../bulk/bulk.service";

// Repositories
import { IInstitutionsRepository } from "./domain/institutions.repository.interface";
import { PrismaInstitutionsRepository } from "./infrastructure/repositories/prisma-institutions.repository";
import { IApprovalsRepository } from "./domain/approvals.repository.interface";
import { PrismaApprovalsRepository } from "./infrastructure/repositories/prisma-approvals.repository";
import { IInvitesRepository } from "./domain/invites.repository.interface";
import { PrismaInvitesRepository } from "./infrastructure/repositories/prisma-invites.repository";
import { IDomainsRepository } from "./domain/domains.repository.interface";
import { PrismaDomainsRepository } from "./infrastructure/repositories/prisma-domains.repository";

// Use Cases
import { GetInstitutionAdminDashboardUseCase } from "./application/use-cases/get-institution-admin-dashboard.use-case";
import { ProcessUserApprovalUseCase } from "./application/use-cases/process-user-approval.use-case";
import { InstitutionInviteUseCase } from "./application/use-cases/institution-invite.use-case";
import { InstitutionDomainUseCase } from "./application/use-cases/institution-domain.use-case";

@Module({
  imports: [PrismaModule, EmailModule, AdminModule, BillingModule, UsersModule],
  controllers: [InstitutionsController],
  providers: [
    InstitutionsService,
    ApprovalService,
    InstitutionInviteService,
    InstitutionDomainService,
    SSOService,
    BulkService,
    // Use Cases
    GetInstitutionAdminDashboardUseCase,
    ProcessUserApprovalUseCase,
    InstitutionInviteUseCase,
    InstitutionDomainUseCase,
    // Repositories
    { provide: IInstitutionsRepository, useClass: PrismaInstitutionsRepository },
    { provide: IApprovalsRepository, useClass: PrismaApprovalsRepository },
    { provide: IInvitesRepository, useClass: PrismaInvitesRepository },
    { provide: IDomainsRepository, useClass: PrismaDomainsRepository },
  ],
  exports: [
    InstitutionsService,
    ApprovalService,
    InstitutionInviteUseCase,
    ProcessUserApprovalUseCase,
    InstitutionInviteService,
    InstitutionDomainService,
    BulkService,
  ],
})
export class InstitutionsModule {}
