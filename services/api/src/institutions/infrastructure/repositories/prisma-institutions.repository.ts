import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { IInstitutionsRepository } from "../../domain/institutions.repository.interface";
import { Institution } from "../../domain/institution.entity";
import { InstitutionMember } from "../../domain/institution-member.entity";

@Injectable()
export class PrismaInstitutionsRepository implements IInstitutionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(institution: Institution): Promise<Institution> {
    const created = await this.prisma.institutions.create({
      data: {
        id: institution.id,
        name: institution.name,
        type: institution.type,
        updated_at: institution.updatedAt,
      },
    });
    return this.mapToDomain(created);
  }

  async findById(id: string): Promise<Institution | null> {
    const found = await this.prisma.institutions.findUnique({
      where: { id },
      include: { classrooms: true },
    });
    return found ? this.mapToDomain(found) : null;
  }

  async findAll(): Promise<Institution[]> {
    const all = await this.prisma.institutions.findMany();
    return all.map(this.mapToDomain);
  }

  async update(
    id: string,
    updates: Partial<Institution>,
  ): Promise<Institution> {
    const updated = await this.prisma.institutions.update({
      where: { id },
      data: {
        name: updates.name,
        type: updates.type,
        updated_at: new Date(),
      },
    });
    return this.mapToDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.institutions.delete({ where: { id } });
  }

  async addMember(member: InstitutionMember): Promise<InstitutionMember> {
    const created = await this.prisma.institution_members.create({
      data: {
        id: member.id,
        institution_id: member.institutionId,
        user_id: member.userId,
        role: member.role,
        status: member.status as any,
      },
    });
    return this.mapMemberToDomain(created);
  }

  async findMember(
    institutionId: string,
    userId: string,
  ): Promise<InstitutionMember | null> {
    const found = await this.prisma.institution_members.findFirst({
      where: { institution_id: institutionId, user_id: userId },
    });
    return found ? this.mapMemberToDomain(found) : null;
  }

  async findAdminMember(
    userId: string,
  ): Promise<(InstitutionMember & { institutions: Institution }) | null> {
    const found = await this.prisma.institution_members.findFirst({
      where: {
        user_id: userId,
        role: "INSTITUTION_EDUCATION_ADMIN",
        status: "ACTIVE",
      },
      include: {
        institutions: true,
      },
    });

    if (!found) return null;

    const domainMember = this.mapMemberToDomain(found);
    return {
      ...domainMember,
      institutions: this.mapToDomain(found.institutions),
    };
  }

  async countMembers(institutionId: string, status?: string): Promise<number> {
    return this.prisma.institution_members.count({
      where: { institution_id: institutionId, status: status as any },
    });
  }

  private mapToDomain(item: any): Institution {
    return new Institution({
      id: item.id,
      name: item.name,
      type: item.type,
      logoUrl: item.logo_url,
      settings: item.settings,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    });
  }

  private mapMemberToDomain(item: any): InstitutionMember {
    return new InstitutionMember({
      id: item.id,
      institutionId: item.institution_id,
      userId: item.user_id,
      role: item.role,
      status: item.status,
      joinedAt: item.joined_at,
    });
  }
}
