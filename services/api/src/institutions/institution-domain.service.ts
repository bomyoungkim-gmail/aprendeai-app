import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from '../admin/admin.service';
import { AddDomainDto } from './dto/institution.dto';

@Injectable()
export class InstitutionDomainService {
  constructor(
    private prisma: PrismaService,
    private adminService: AdminService,
  ) {}

  /**
   * Add a domain to an institution
   */
  async addDomain(
    institutionId: string,
    dto: AddDomainDto,
    addedBy: string,
  ) {
    // Validate domain format (@domain.com)
    const domainPattern = /^@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!domainPattern.test(dto.domain)) {
      throw new BadRequestException(
        'Invalid domain format. Must be @domain.com',
      );
    }
    
    // Check if domain already exists
    const existing = await this.prisma.institutionDomain.findUnique({
      where: { domain: dto.domain.toLowerCase() },
    });
    
    if (existing) {
      throw new ConflictException('Domain already registered to another institution');
    }
    
    // Create domain
    const domain = await this.prisma.institutionDomain.create({
      data: {
        institutionId,
        domain: dto.domain.toLowerCase(),
        autoApprove: dto.autoApprove,
        defaultRole: dto.defaultRole,
      },
    });
    
    // Audit log
    await this.adminService.createAuditLog({
      actorUserId: addedBy,
      action: 'ADD_INSTITUTION_DOMAIN',
      resourceType: 'InstitutionDomain',
      resourceId: domain.id,
      afterJson: dto,
    });
    
    return domain;
  }

  /**
   * Find domain configuration by email
   */
  async findByEmail(email: string) {
    const emailDomain = '@' + email.split('@')[1];
    
    return this.prisma.institutionDomain.findUnique({
      where: { domain: emailDomain.toLowerCase() },
      include: { institution: true },
    });
  }

  /**
   * Get all domains for an institution
   */
  async findByInstitution(institutionId: string) {
    return this.prisma.institutionDomain.findMany({
      where: { institutionId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Remove a domain
   */
  async removeDomain(domainId: string, removedBy: string) {
    const domain = await this.prisma.institutionDomain.findUnique({
      where: { id: domainId },
    });
    
    if (!domain) {
      throw new BadRequestException('Domain not found');
    }
    
    // Check if there are users with this domain
    const usersCount = await this.prisma.user.count({
      where: {
        email: { endsWith: domain.domain.substring(1) }, // Remove @
        institutionId: domain.institutionId,
      },
    });
    
    if (usersCount > 0) {
      throw new ConflictException(
        `Cannot remove domain with ${usersCount} active users`,
      );
    }
    
    // Delete domain
    await this.prisma.institutionDomain.delete({
      where: { id: domainId },
    });
    
    // Audit log
    await this.adminService.createAuditLog({
      actorUserId: removedBy,
      action: 'REMOVE_INSTITUTION_DOMAIN',
      resourceType: 'InstitutionDomain',
      resourceId: domainId,
      beforeJson: domain,
    });
    
    return { message: 'Domain removed successfully' };
  }

  /**
   * Update domain settings
   */
  async updateDomain(
    domainId: string,
    updates: { autoApprove?: boolean; defaultRole?: any },
    updatedBy: string,
  ) {
    const domain = await this.prisma.institutionDomain.update({
      where: { id: domainId },
      data: updates,
    });
    
    // Audit log
    await this.adminService.createAuditLog({
      actorUserId: updatedBy,
      action: 'UPDATE_INSTITUTION_DOMAIN',
      resourceType: 'InstitutionDomain',
      resourceId: domainId,
      afterJson: updates,
    });
    
    return domain;
  }
}
