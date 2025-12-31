"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessUserApprovalUseCase = void 0;
const common_1 = require("@nestjs/common");
const approvals_repository_interface_1 = require("../../domain/approvals.repository.interface");
const institutions_repository_interface_1 = require("../../domain/institutions.repository.interface");
const prisma_service_1 = require("../../../prisma/prisma.service");
const email_service_1 = require("../../../email/email.service");
const admin_service_1 = require("../../../admin/admin.service");
const subscription_service_1 = require("../../../billing/subscription.service");
const client_1 = require("@prisma/client");
const uuid_1 = require("uuid");
let ProcessUserApprovalUseCase = class ProcessUserApprovalUseCase {
    constructor(approvalsRepository, institutionsRepository, prisma, emailService, adminService, subscriptionService) {
        this.approvalsRepository = approvalsRepository;
        this.institutionsRepository = institutionsRepository;
        this.prisma = prisma;
        this.emailService = emailService;
        this.adminService = adminService;
        this.subscriptionService = subscriptionService;
    }
    async approve(approvalId, reviewedBy) {
        const approval = await this.approvalsRepository.findById(approvalId);
        if (!approval)
            throw new common_1.NotFoundException("Approval not found");
        if (approval.status !== "PENDING")
            throw new common_1.BadRequestException("Approval already processed");
        const user = await this.prisma.$transaction(async (tx) => {
            const user = await tx.users.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    name: approval.name,
                    email: approval.email,
                    password_hash: approval.tempPasswordHash,
                    last_institution_id: approval.institutionId,
                    schooling_level: "ADULT",
                    status: "ACTIVE",
                    updated_at: new Date(),
                    last_context_role: this.mapToContextRole(approval.requestedRole),
                },
            });
            await tx.institution_members.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    institution_id: approval.institutionId,
                    user_id: user.id,
                    role: approval.requestedRole,
                    status: "ACTIVE",
                },
            });
            await tx.pending_user_approvals.update({
                where: { id: approvalId },
                data: {
                    status: "APPROVED",
                    reviewed_by: reviewedBy,
                    reviewed_at: new Date(),
                },
            });
            return user;
        });
        await this.subscriptionService.createInitialSubscription("USER", user.id);
        const institution = await this.institutionsRepository.findById(approval.institutionId);
        await this.emailService.sendEmail({
            to: approval.email,
            subject: "Cadastro Aprovado! 🎉",
            template: "approval-success",
            context: {
                name: approval.name,
                institutionName: institution === null || institution === void 0 ? void 0 : institution.name,
                loginUrl: `${process.env.FRONTEND_URL}/login`,
            },
        });
        await this.adminService.createAuditLog({
            actorUserId: reviewedBy,
            action: "APPROVE_USER",
            resourceType: "PendingUserApproval",
            resourceId: approvalId,
        });
        return user;
    }
    async reject(approvalId, reviewedBy, reason) {
        const approval = await this.approvalsRepository.findById(approvalId);
        if (!approval)
            throw new common_1.NotFoundException("Approval not found");
        await this.approvalsRepository.update(approvalId, {
            status: "REJECTED",
            reviewedBy,
            reviewedAt: new Date(),
            rejectionReason: reason,
        });
        const institution = await this.institutionsRepository.findById(approval.institutionId);
        await this.emailService.sendEmail({
            to: approval.email,
            subject: "Atualização sobre seu Cadastro",
            template: "approval-rejected",
            context: {
                name: approval.name,
                institutionName: institution === null || institution === void 0 ? void 0 : institution.name,
                reason,
            },
        });
        await this.adminService.createAuditLog({
            actorUserId: reviewedBy,
            action: "REJECT_USER",
            resourceType: "PendingUserApproval",
            resourceId: approvalId,
            afterJson: { reason },
        });
        return { message: "User registration rejected" };
    }
    mapToContextRole(role) {
        if (role === "INSTITUTION_EDUCATION_ADMIN" || role === "INSTITUTION_ADMIN") {
            return client_1.ContextRole.INSTITUTION_EDUCATION_ADMIN;
        }
        if (role === "TEACHER")
            return client_1.ContextRole.TEACHER;
        return client_1.ContextRole.STUDENT;
    }
};
exports.ProcessUserApprovalUseCase = ProcessUserApprovalUseCase;
exports.ProcessUserApprovalUseCase = ProcessUserApprovalUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(approvals_repository_interface_1.IApprovalsRepository)),
    __param(1, (0, common_1.Inject)(institutions_repository_interface_1.IInstitutionsRepository)),
    __metadata("design:paramtypes", [Object, Object, prisma_service_1.PrismaService,
        email_service_1.EmailService,
        admin_service_1.AdminService,
        subscription_service_1.SubscriptionService])
], ProcessUserApprovalUseCase);
//# sourceMappingURL=process-user-approval.use-case.js.map