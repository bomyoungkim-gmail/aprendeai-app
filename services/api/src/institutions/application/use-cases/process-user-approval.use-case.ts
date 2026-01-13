import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { IApprovalsRepository } from "../../domain/approvals.repository.interface";
import { IInstitutionsRepository } from "../../domain/institutions.repository.interface";
import { PrismaService } from "../../../prisma/prisma.service";
import { EmailService } from "../../../email/email.service";
import { AdminService } from "../../../admin/admin.service";
import { SubscriptionService } from "../../../billing/subscription.service";
import { ContextRole } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class ProcessUserApprovalUseCase {
  constructor(
    @Inject(IApprovalsRepository)
    private readonly approvalsRepository: IApprovalsRepository,
    @Inject(IInstitutionsRepository)
    private readonly institutionsRepository: IInstitutionsRepository,
    private readonly prisma: PrismaService, // For cross-module transaction if needed, or use tx manager
    private readonly emailService: EmailService,
    private readonly adminService: AdminService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async approve(approvalId: string, reviewedBy: string) {
    const approval = await this.approvalsRepository.findById(approvalId);
    if (!approval) throw new NotFoundException("Approval not found");
    if (approval.status !== "PENDING")
      throw new BadRequestException("Approval already processed");

    // We use PrismaService directly for the complex cross-entity transaction (User, Member, Subscription, Approval)
    const user = await this.prisma.$transaction(async (tx) => {
      // Create User
      const user = await tx.users.create({
        data: {
          id: uuidv4(),
          name: approval.name,
          email: approval.email,

          last_institution_id: approval.institutionId,
          schooling_level: "ADULT",
          status: "ACTIVE",
          updated_at: new Date(),
          last_context_role: this.mapToContextRole(approval.requestedRole),
        },
      });

      // Create InstitutionMember
      await tx.institution_members.create({
        data: {
          id: uuidv4(),
          institution_id: approval.institutionId,
          user_id: user.id,
          role: approval.requestedRole,
          status: "ACTIVE",
        },
      });

      // Create User Identity (Password)
      await tx.user_identities.create({
        data: {
          user_id: user.id,
          provider: "password",
          provider_id: user.email,
          email: user.email,
          password_hash: approval.tempPasswordHash,
        },
      });

      // Update approval status
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

    // Create subscription
    await this.subscriptionService.createInitialSubscription("USER", user.id);

    // Notify user
    const institution = await this.institutionsRepository.findById(
      approval.institutionId,
    );
    await this.emailService.sendEmail({
      to: approval.email,
      subject: "Cadastro Aprovado! 🎉",
      template: "approval-success",
      context: {
        name: approval.name,
        institutionName: institution?.name,
        loginUrl: `${process.env.FRONTEND_URL}/login`,
      },
    });

    // Audit log
    await this.adminService.createAuditLog({
      actorUserId: reviewedBy,
      action: "APPROVE_USER",
      resourceType: "PendingUserApproval",
      resourceId: approvalId,
    });

    return user;
  }

  async reject(approvalId: string, reviewedBy: string, reason: string) {
    const approval = await this.approvalsRepository.findById(approvalId);
    if (!approval) throw new NotFoundException("Approval not found");

    await this.approvalsRepository.update(approvalId, {
      status: "REJECTED",
      reviewedBy,
      reviewedAt: new Date(),
      rejectionReason: reason,
    });

    const institution = await this.institutionsRepository.findById(
      approval.institutionId,
    );
    await this.emailService.sendEmail({
      to: approval.email,
      subject: "Atualização sobre seu Cadastro",
      template: "approval-rejected",
      context: {
        name: approval.name,
        institutionName: institution?.name,
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

  private mapToContextRole(role: string): ContextRole {
    if (
      role === "INSTITUTION_EDUCATION_ADMIN" ||
      role === "INSTITUTION_ADMIN"
    ) {
      return ContextRole.INSTITUTION_EDUCATION_ADMIN;
    }
    if (role === "TEACHER") return ContextRole.TEACHER;
    return ContextRole.STUDENT;
  }
}
