import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { IInvitesRepository } from "../../domain/invites.repository.interface";
import { InstitutionInvite } from "../../domain/institution-invite.entity";

@Injectable()
export class PrismaInvitesRepository implements IInvitesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(invite: InstitutionInvite): Promise<InstitutionInvite> {
    const created = await this.prisma.institution_invites.create({
      data: {
        id: invite.id,
        institution_id: invite.institutionId,
        email: invite.email,
        role: invite.role,
        token: invite.token,
        expires_at: invite.expiresAt,
        invited_by: invite.invitedBy,
      },
    });
    return this.mapToDomain(created);
  }

  async findByToken(token: string): Promise<InstitutionInvite | null> {
    const found = await this.prisma.institution_invites.findUnique({
      where: { token },
      include: {
        institutions: true,
        users: { select: { id: true, name: true, email: true } },
      },
    });
    return found ? this.mapToDomain(found) : null;
  }

  async findById(id: string): Promise<InstitutionInvite | null> {
    const found = await this.prisma.institution_invites.findUnique({
      where: { id },
    });
    return found ? this.mapToDomain(found) : null;
  }

  async findByInstitution(institutionId: string): Promise<InstitutionInvite[]> {
    const all = await this.prisma.institution_invites.findMany({
      where: { institution_id: institutionId },
      include: {
        users: { select: { id: true, name: true, email: true } },
      },
      orderBy: { created_at: "desc" },
    });
    return all.map(this.mapToDomain);
  }

  async update(
    id: string,
    updates: Partial<InstitutionInvite>,
  ): Promise<InstitutionInvite> {
    const updated = await this.prisma.institution_invites.update({
      where: { id },
      data: {
        used_at: updates.usedAt,
        expires_at: updates.expiresAt,
      },
    });
    return this.mapToDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.institution_invites.delete({ where: { id } });
  }

  async countActive(institutionId: string): Promise<number> {
    return this.prisma.institution_invites.count({
      where: {
        institution_id: institutionId,
        used_at: null,
        expires_at: { gt: new Date() },
      },
    });
  }

  async invalidatePrevious(
    institutionId: string,
    email: string,
  ): Promise<void> {
    await this.prisma.institution_invites.updateMany({
      where: {
        institution_id: institutionId,
        email: email.toLowerCase(),
        used_at: null,
      },
      data: {
        expires_at: new Date(),
      },
    });
  }

  private mapToDomain(item: any): InstitutionInvite {
    return new InstitutionInvite({
      id: item.id,
      institutionId: item.institution_id,
      email: item.email,
      role: item.role,
      token: item.token,
      expiresAt: item.expires_at,
      invitedBy: item.invited_by,
      usedAt: item.used_at,
      createdAt: item.created_at,
    });
  }
}
