import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { AdminService } from '../admin/admin.service';
import { SubscriptionService } from '../billing/subscription.service';
import { ProcessApprovalDto } from './dto/institution.dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

@Injectable()
export class ApprovalService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private adminService: AdminService,
    private subscriptionService: SubscriptionService,
  ) {}

  /**
   * Create a pending user approval
   */
  async createPending(
    institutionId: string,
    email: string,
    name: string,
    password: string,
    requestedRole: UserRole,
  ) {
    const tempPasswordHash = await bcrypt.hash(password, 10);
    
    const pending = await this.prisma.pendingUserApproval.create({
      data: {
        institutionId,
        email: email.toLowerCase(),
        name,
        tempPasswordHash,
        requestedRole,
        status: 'PENDING',
      },
      include: {
        institution: {
          select: { id: true, name: true },
        },
      },
    });
    
    // Email to user
    await this.emailService.sendEmail({
      to: email,
      subject: 'Cadastro em Análise - AprendeAI',
      template: 'pending-approval',
      context: {
        name,
        institutionName: pending.institution.name,
      },
    });
    
    // Notify institution admins
    await this.notifyInstitutionAdmins(institutionId, pending.id, name, email);
    
    return {
      status: 'pending_approval',
      message: 'Your registration is under review',
      approvalId: pending.id,
    };
  }

  /**
   * Approve a pending user
   */
  async approve(approvalId: string, reviewedBy: string) {
    return this.prisma.$transaction(async (tx) => {
      const approval = await tx.pendingUserApproval.findUnique({
        where: { id: approvalId },
        include: {
          institution: {
            include: { members: true },
          },
        },
      });
      
      if (!approval) {
        throw new NotFoundException('Approval not found');
      }
      
      if (approval.status !== 'PENDING') {
        throw new BadRequestException('Approval already processed');
      }
      
      // Create User
      const user = await tx.user.create({
        data: {
          name: approval.name,
          email: approval.email,
          passwordHash: approval.tempPasswordHash,
          role: approval.requestedRole,
          institutionId: approval.institutionId,
          schoolingLevel: 'ADULT',
          status: 'ACTIVE',
        },
      });
      
      // Create InstitutionMember
      await tx.institutionMember.create({
        data: {
          institutionId: approval.institutionId,
          userId: user.id,
          role: approval.requestedRole,
          status: 'ACTIVE',
        },
      });
      
      // Create subscription
      await this.subscriptionService.createInitialSubscription('USER', user.id, tx);
      
      // Update approval status
      await tx.pendingUserApproval.update({
        where: { id: approvalId },
        data: {
          status: 'APPROVED',
          reviewedBy,
          reviewedAt: new Date(),
        },
      });
      
      return user;
    });
    
    // Send approval email (outside transaction)
    const approval = await this.prisma.pendingUserApproval.findUnique({
      where: { id: approvalId },
      include: {
        institution: true,
      },
    });
    
    await this.emailService.sendEmail({
      to: approval.email,
      subject: 'Cadastro Aprovado! 🎉',
      template: 'approval-success',
      context: {
        name: approval.name,
        institutionName: approval.institution.name,
        loginUrl: `${process.env.FRONTEND_URL}/login`,
      },
    });
    
    // Audit log
    await this.adminService.createAuditLog({
      actorUserId: reviewedBy,
      action: 'APPROVE_USER',
      resourceType: 'PendingUserApproval',
      resourceId: approvalId,
    });
  }

  /**
   * Reject a pending user
   */
  async reject(
    approvalId: string,
    reviewedBy: string,
    reason: string,
  ) {
    const approval = await this.prisma.pendingUserApproval.update({
      where: { id: approvalId },
      data: {
        status: 'REJECTED',
        reviewedBy,
        reviewedAt: new Date(),
        rejectionReason: reason,
      },
      include: {
        institution: true,
      },
    });
    
    // Send rejection email
    await this.emailService.sendEmail({
      to: approval.email,
      subject: 'Atualização sobre seu Cadastro',
      template: 'approval-rejected',
      context: {
        name: approval.name,
        institutionName: approval.institution.name,
        reason,
      },
    });
    
    // Audit log
    await this.adminService.createAuditLog({
      actorUserId: reviewedBy,
      action: 'REJECT_USER',
      resourceType: 'PendingUserApproval',
      resourceId: approvalId,
      afterJson: { reason },
    });
    
    return { message: 'User registration rejected' };
  }

  /**
   * Get all pending approvals for an institution
   */
  async findByInstitution(institutionId: string) {
    return this.prisma.pendingUserApproval.findMany({
      where: {
        institutionId,
        status: 'PENDING',
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  /**
   * Notify institution admins about new approval request
   */
  private async notifyInstitutionAdmins(
    institutionId: string,
    approvalId: string,
    userName: string,
    userEmail: string,
  ) {
    // Find institution admins
    const admins = await this.prisma.user.findMany({
      where: {
        institutionId,
        role: {
          in: ['ADMIN', 'INSTITUTION_ADMIN', 'SCHOOL_ADMIN'],
        },
      },
      select: { email: true, name: true },
    });
    
    // Send email to each admin
    for (const admin of admins) {
      await this.emailService.sendEmail({
        to: admin.email,
        subject: 'Nova Solicitação de Cadastro',
        template: 'admin-approval-notification',
        context: {
          adminName: admin.name,
          userName,
          userEmail,
          approvalUrl: `${process.env.FRONTEND_URL}/admin/institutions/${institutionId}/pending`,
        },
      });
    }
  }
}
