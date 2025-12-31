import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { IStudyGroupsRepository } from "../../domain/study-groups.repository.interface";
import { StudyGroup, StudyGroupMember } from "../../domain/study-group.entity";

@Injectable()
export class PrismaStudyGroupsRepository implements IStudyGroupsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(group: StudyGroup): Promise<StudyGroup> {
    const created = await this.prisma.study_groups.create({
      data: {
        id: group.id,
        name: group.name,
        scope_type: group.scopeType as any,
        scope_id: group.scopeId,
        users_owner: { connect: { id: group.ownerId } },
      },
    });
    return this.mapToDomain(created);
  }

  async findById(id: string): Promise<StudyGroup | null> {
    const found = await this.prisma.study_groups.findUnique({
      where: { id },
      include: {
        study_group_members: {
            include: { users: { select: { id: true, name: true, email: true } } }
        },
        _count: { select: { group_sessions: true } }
      }
    });
    return found ? this.mapToDomain(found) : null;
  }

  async findByUser(userId: string): Promise<StudyGroup[]> {
    const memberships = await this.prisma.study_group_members.findMany({
      where: { user_id: userId, status: "ACTIVE" },
      include: {
        study_groups: {
          include: {
            _count: { select: { study_group_members: true } },
          },
        },
      },
    });
    return memberships.map((m) => this.mapToDomain(m.study_groups));
  }

  async update(id: string, updates: Partial<StudyGroup>): Promise<StudyGroup> {
    const updated = await this.prisma.study_groups.update({
      where: { id },
      data: {
        name: updates.name,
      },
    });
    return this.mapToDomain(updated);
  }

  async addMember(member: StudyGroupMember): Promise<StudyGroupMember> {
    const created = await this.prisma.study_group_members.create({
      data: {
        group_id: member.groupId,
        user_id: member.userId,
        role: member.role,
        status: member.status as any,
      },
    });
    return this.mapMemberToDomain(created);
  }

  async findMember(groupId: string, userId: string): Promise<StudyGroupMember | null> {
    const found = await this.prisma.study_group_members.findUnique({
      where: { group_id_user_id: { group_id: groupId, user_id: userId } },
    });
    return found ? this.mapMemberToDomain(found) : null;
  }

  async updateMember(groupId: string, userId: string, updates: Partial<StudyGroupMember>): Promise<StudyGroupMember> {
    const updated = await this.prisma.study_group_members.update({
      where: { group_id_user_id: { group_id: groupId, user_id: userId } },
      data: {
        role: updates.role,
        status: updates.status as any,
      },
    });
    return this.mapMemberToDomain(updated);
  }

  async findActiveMembers(groupId: string): Promise<StudyGroupMember[]> {
    const all = await this.prisma.study_group_members.findMany({
      where: { group_id: groupId, status: "ACTIVE" },
      include: { users: { select: { id: true, name: true } } },
    });
    return all.map(this.mapMemberToDomain);
  }

  async addContentShare(groupId: string, contentId: string, createdBy: string): Promise<void> {
    await this.prisma.content_shares.create({
      data: {
        content_id: contentId,
        context_type: "STUDY_GROUP",
        context_id: groupId,
        created_by: createdBy,
      },
    });
  }

  async removeContentShare(groupId: string, contentId: string): Promise<void> {
    await this.prisma.content_shares.deleteMany({
      where: {
        content_id: contentId,
        context_type: "STUDY_GROUP",
        context_id: groupId,
      },
    });
  }

  async isContentShared(groupId: string, contentId: string): Promise<boolean> {
    const found = await this.prisma.content_shares.findFirst({
      where: {
        content_id: contentId,
        context_type: "STUDY_GROUP",
        context_id: groupId,
      },
    });
    return !!found;
  }

  private mapToDomain(item: any): StudyGroup {
    return new StudyGroup({
      id: item.id,
      name: item.name,
      scopeType: item.scope_type,
      scopeId: item.scope_id,
      ownerId: item.owner_id,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    });
  }

  private mapMemberToDomain(item: any): StudyGroupMember {
    return new StudyGroupMember({
      id: item.id,
      groupId: item.group_id,
      userId: item.user_id,
      role: item.role,
      status: item.status,
      joinedAt: item.joined_at,
    });
  }
}
