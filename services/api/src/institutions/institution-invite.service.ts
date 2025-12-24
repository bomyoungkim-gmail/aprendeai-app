import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { AdminService } from '../admin/admin.service';
import * as crypto from 'crypto';
import { CreateInviteDto } from './dto/institution.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class InstitutionInviteService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private adminService: AdminService,
  ) {}

  /**
   * Create a new institution invite
   */
  async create(
    institutionId: string,
    dto: CreateInviteDto,
    invitedBy: string,
  ) {
    // Generate crypto-secure 32-byte hex token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Calculate expiration
    const expiresInDays = dto.expiresInDays || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    
    // Check if email already exists as a user
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }
    
    // Invalidate any previous unused invites for this email
    await this.prisma.institutionInvite.updateMany({
      where: {
        institutionId,
        email: dto.email.toLowerCase(),
        usedAt: null,
      },
      data: {
        expiresAt: new Date(), // Expire immediately
      },
    });
    
    // Create new invite
    const invite = await this.prisma.institutionInvite.create({
      data: {
        institutionId,
        email: dto.email.toLowerCase(),
        role: dto.role,
        token,
        expiresAt,
        invitedBy,
      },
      include: {
        institution: true,
        inviter: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    
    // Send invitation email
    const inviteUrl = `${process.env.FRONTEND_URL}/register/invite?token=${token}`;
    
    await this.emailService.sendEmail({
      to: dto.email,
      subject: `Convite para ${invite.institution.name}`,
      template: 'institution-invite',
      context: {
        institutionName: invite.institution.name,
        inviterName: invite.inviter.name,
        inviteUrl,
        expiresAt,
        role: dto.role,
      },
    });
    
    // Create audit log
    await this.adminService.createAuditLog({
      actorUserId: invitedBy,
      action: 'INVITE_TO_INSTITUTION',
      resourceType: 'InstitutionInvite',
      resourceId: invite.id,
      afterJson: { 
        email: dto.email, 
        role: dto.role,
        institutionId,
        expiresAt,
      },
    });
    
    return {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
      inviteUrl, // Return for testing purposes
    };
  }

  /**
   * Validate an invite token
   */
  async validate(token: string) {
    const invite = await this.prisma.institutionInvite.findUnique({
      where: { token },
      include: {
        institution: {
          select: { id: true, name: true },
        },
      },
    });
    
    if (!invite) {
      return { valid: false, message: 'Invalid token' };
    }
    
    if (invite.usedAt) {
      return { valid: false, message: 'Invite already used' };
    }
    
    if (invite.expiresAt < new Date()) {
      return { valid: false, message: 'Invite expired' };
    }
    
    return {
      valid: true,
      institutionId: invite.institution.id,
      institutionName: invite.institution.name,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
    };
  }

  /**
   * Mark invite as used
   */
  async markAsUsed(inviteId: string) {
    return this.prisma.institutionInvite.update({
      where: { id: inviteId },
      data: { usedAt: new Date() },
    });
  }

  /**
   * Find invite by token (for registration flow)
   */
  async findByToken(token: string) {
    return this.prisma.institutionInvite.findUnique({
      where: { token },
      include: {
        institution: true,
      },
    });
  }

  /**
   * List all invites for an institution
   */
  async findByInstitution(institutionId: string) {
    return this.prisma.institutionInvite.findMany({
      where: { institutionId },
      include: {
        inviter: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Delete (cancel) an invite
   */
  async delete(inviteId: string, deletedBy: string) {
    const invite = await this.prisma.institutionInvite.findUnique({
      where: { id: inviteId },
    });
    
    if (!invite) {
      throw new NotFoundException('Invite not found');
    }
    
    await this.prisma.institutionInvite.delete({
      where: { id: inviteId },
    });
    
    // Audit log
    await this.adminService.createAuditLog({
      actorUserId: deletedBy,
      action: 'CANCEL_INSTITUTION_INVITE',
      resourceType: 'InstitutionInvite',
      resourceId: inviteId,
      beforeJson: invite,
    });
    
    return { message: 'Invite cancelled successfully' };
  }
}
