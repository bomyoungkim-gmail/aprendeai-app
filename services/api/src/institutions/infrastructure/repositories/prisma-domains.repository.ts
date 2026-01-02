import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  IDomainsRepository,
  InstitutionDomain,
} from "../../domain/domains.repository.interface";

@Injectable()
export class PrismaDomainsRepository implements IDomainsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(domain: InstitutionDomain): Promise<InstitutionDomain> {
    const created = await this.prisma.institution_domains.create({
      data: {
        id: domain.id,
        institution_id: domain.institutionId,
        domain: domain.domain,
        auto_approve: domain.autoApprove,
        default_role: domain.defaultRole as any,
      },
    });
    return this.mapToDomain(created);
  }

  async findByDomain(domain: string): Promise<InstitutionDomain | null> {
    const found = await this.prisma.institution_domains.findUnique({
      where: { domain: domain.toLowerCase() },
      include: { institutions: true },
    });
    return found ? this.mapToDomain(found) : null;
  }

  async findByInstitution(institutionId: string): Promise<InstitutionDomain[]> {
    const all = await this.prisma.institution_domains.findMany({
      where: { institution_id: institutionId },
      orderBy: { created_at: "desc" },
    });
    return all.map(this.mapToDomain);
  }

  async findById(id: string): Promise<InstitutionDomain | null> {
    const found = await this.prisma.institution_domains.findUnique({
      where: { id },
    });
    return found ? this.mapToDomain(found) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.institution_domains.delete({ where: { id } });
  }

  async update(
    id: string,
    updates: Partial<InstitutionDomain>,
  ): Promise<InstitutionDomain> {
    const updated = await this.prisma.institution_domains.update({
      where: { id },
      data: {
        auto_approve: updates.autoApprove,
        default_role: updates.defaultRole as any,
      },
    });
    return this.mapToDomain(updated);
  }

  private mapToDomain(item: any): InstitutionDomain {
    return new InstitutionDomain({
      id: item.id,
      institutionId: item.institution_id,
      domain: item.domain,
      autoApprove: item.auto_approve,
      defaultRole: item.default_role,
      createdAt: item.created_at,
    });
  }
}
