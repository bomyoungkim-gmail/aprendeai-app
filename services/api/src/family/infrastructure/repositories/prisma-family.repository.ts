import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { IFamilyRepository } from "../../domain/family.repository.interface";
import { Family, FamilyMember } from "../../domain/family.entity";

@Injectable()
export class PrismaFamilyRepository implements IFamilyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(family: Family): Promise<Family> {
    const created = await this.prisma.families.create({
      data: {
        id: family.id,
        name: family.name,
        owner_user_id: family.ownerUserId,
        updated_at: family.updatedAt,
      },
    });
    return this.mapToDomain(created);
  }

  async findById(id: string): Promise<Family | null> {
    const found = await this.prisma.families.findUnique({
      where: { id },
      include: {
        family_members: {
          include: {
            users: {
              select: { id: true, name: true, email: true, avatar_url: true },
            },
          },
        },
        users_owner: { select: { id: true, name: true, email: true } },
      },
    });
    return found ? this.mapToDomain(found) : null;
  }

  async findByUser(userId: string): Promise<Family[]> {
    const memberships = await this.prisma.family_members.findMany({
      where: { user_id: userId },
      include: { families: { include: { family_members: true } } },
    });
    return memberships.map((m) => this.mapToDomain(m.families));
  }

  async update(id: string, updates: Partial<Family>): Promise<Family> {
    const updated = await this.prisma.families.update({
      where: { id },
      data: {
        name: updates.name,
        owner_user_id: updates.ownerUserId,
        updated_at: new Date(),
      },
    });
    return this.mapToDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.families.delete({ where: { id } });
  }

  async addMember(member: FamilyMember): Promise<FamilyMember> {
    const created = await this.prisma.family_members.create({
      data: {
        id: member.id,
        family_id: member.familyId,
        user_id: member.userId,
        role: member.role,
        status: member.status as any,
        display_name: member.displayName,
      },
    });
    return this.mapMemberToDomain(created);
  }

  async findMember(
    familyId: string,
    userId: string,
  ): Promise<FamilyMember | null> {
    const found = await this.prisma.family_members.findUnique({
      where: { family_id_user_id: { family_id: familyId, user_id: userId } },
    });
    return found ? this.mapMemberToDomain(found) : null;
  }

  async updateMember(
    familyId: string,
    userId: string,
    updates: Partial<FamilyMember>,
  ): Promise<FamilyMember> {
    const updated = await this.prisma.family_members.update({
      where: { family_id_user_id: { family_id: familyId, user_id: userId } },
      data: {
        role: updates.role,
        status: updates.status as any,
        display_name: updates.displayName,
      },
    });
    return this.mapMemberToDomain(updated);
  }

  async deleteMember(familyId: string, userId: string): Promise<void> {
    await this.prisma.family_members.delete({
      where: { family_id_user_id: { family_id: familyId, user_id: userId } },
    });
  }

  async findAll(): Promise<Family[]> {
    const families = await this.prisma.families.findMany({
      include: {
        family_members: {
          include: {
            users: true,
          },
        },
      },
    });
    return families.map((f) => this.mapToDomain(f));
  }

  private mapToDomain(item: any): Family {
    return new Family({
      id: item.id,
      name: item.name,
      ownerUserId: item.owner_user_id,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      members: item.family_members?.map((m: any) => this.mapMemberToDomain(m)),
    });
  }

  private mapMemberToDomain(item: any): FamilyMember {
    return new FamilyMember({
      id: item.id,
      familyId: item.family_id,
      userId: item.user_id,
      role: item.role,
      status: item.status,
      displayName: item.display_name,
      joinedAt: item.joined_at,
      user: item.users
        ? {
            email: item.users.email,
            name: item.users.name,
          }
        : undefined,
    });
  }
}
