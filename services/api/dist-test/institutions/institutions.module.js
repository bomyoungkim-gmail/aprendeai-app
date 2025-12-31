"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstitutionsModule = void 0;
const common_1 = require("@nestjs/common");
const institutions_service_1 = require("./institutions.service");
const institutions_controller_1 = require("./institutions.controller");
const prisma_module_1 = require("../prisma/prisma.module");
const email_module_1 = require("../email/email.module");
const admin_module_1 = require("../admin/admin.module");
const billing_module_1 = require("../billing/billing.module");
const approval_service_1 = require("./approval.service");
const institution_invite_service_1 = require("./institution-invite.service");
const institution_domain_service_1 = require("./institution-domain.service");
const sso_service_1 = require("./sso.service");
const users_module_1 = require("../users/users.module");
const bulk_service_1 = require("../bulk/bulk.service");
const institutions_repository_interface_1 = require("./domain/institutions.repository.interface");
const prisma_institutions_repository_1 = require("./infrastructure/repositories/prisma-institutions.repository");
const approvals_repository_interface_1 = require("./domain/approvals.repository.interface");
const prisma_approvals_repository_1 = require("./infrastructure/repositories/prisma-approvals.repository");
const invites_repository_interface_1 = require("./domain/invites.repository.interface");
const prisma_invites_repository_1 = require("./infrastructure/repositories/prisma-invites.repository");
const domains_repository_interface_1 = require("./domain/domains.repository.interface");
const prisma_domains_repository_1 = require("./infrastructure/repositories/prisma-domains.repository");
const get_institution_admin_dashboard_use_case_1 = require("./application/use-cases/get-institution-admin-dashboard.use-case");
const process_user_approval_use_case_1 = require("./application/use-cases/process-user-approval.use-case");
const institution_invite_use_case_1 = require("./application/use-cases/institution-invite.use-case");
const institution_domain_use_case_1 = require("./application/use-cases/institution-domain.use-case");
let InstitutionsModule = class InstitutionsModule {
};
exports.InstitutionsModule = InstitutionsModule;
exports.InstitutionsModule = InstitutionsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, email_module_1.EmailModule, admin_module_1.AdminModule, billing_module_1.BillingModule, users_module_1.UsersModule],
        controllers: [institutions_controller_1.InstitutionsController],
        providers: [
            institutions_service_1.InstitutionsService,
            approval_service_1.ApprovalService,
            institution_invite_service_1.InstitutionInviteService,
            institution_domain_service_1.InstitutionDomainService,
            sso_service_1.SSOService,
            bulk_service_1.BulkService,
            get_institution_admin_dashboard_use_case_1.GetInstitutionAdminDashboardUseCase,
            process_user_approval_use_case_1.ProcessUserApprovalUseCase,
            institution_invite_use_case_1.InstitutionInviteUseCase,
            institution_domain_use_case_1.InstitutionDomainUseCase,
            { provide: institutions_repository_interface_1.IInstitutionsRepository, useClass: prisma_institutions_repository_1.PrismaInstitutionsRepository },
            { provide: approvals_repository_interface_1.IApprovalsRepository, useClass: prisma_approvals_repository_1.PrismaApprovalsRepository },
            { provide: invites_repository_interface_1.IInvitesRepository, useClass: prisma_invites_repository_1.PrismaInvitesRepository },
            { provide: domains_repository_interface_1.IDomainsRepository, useClass: prisma_domains_repository_1.PrismaDomainsRepository },
        ],
        exports: [
            institutions_service_1.InstitutionsService,
            approval_service_1.ApprovalService,
            institution_invite_use_case_1.InstitutionInviteUseCase,
            process_user_approval_use_case_1.ProcessUserApprovalUseCase,
            institution_invite_service_1.InstitutionInviteService,
            institution_domain_service_1.InstitutionDomainService,
            bulk_service_1.BulkService,
        ],
    })
], InstitutionsModule);
//# sourceMappingURL=institutions.module.js.map