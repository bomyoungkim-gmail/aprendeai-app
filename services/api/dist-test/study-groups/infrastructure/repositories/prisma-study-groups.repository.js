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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaStudyGroupsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const study_group_entity_1 = require("../../domain/study-group.entity");
let PrismaStudyGroupsRepository = class PrismaStudyGroupsRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(group) {
        const created = await this.prisma.study_groups.create({
            data: {
                id: group.id,
                name: group.name,
                scope_type: group.scopeType,
                scope_id: group.scopeId,
                users_owner: { connect: { id: group.ownerId } },
            },
        });
        return this.mapToDomain(created);
    }
    async findById(id) {
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
    async findByUser(userId) {
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
    async update(id, updates) {
        const updated = await this.prisma.study_groups.update({
            where: { id },
            data: {
                name: updates.name,
            },
        });
        return this.mapToDomain(updated);
    }
    async addMember(member) {
        const created = await this.prisma.study_group_members.create({
            data: {
                group_id: member.groupId,
                user_id: member.userId,
                role: member.role,
                status: member.status,
            },
        });
        return this.mapMemberToDomain(created);
    }
    async findMember(groupId, userId) {
        const found = await this.prisma.study_group_members.findUnique({
            where: { group_id_user_id: { group_id: groupId, user_id: userId } },
        });
        return found ? this.mapMemberToDomain(found) : null;
    }
    async updateMember(groupId, userId, updates) {
        const updated = await this.prisma.study_group_members.update({
            where: { group_id_user_id: { group_id: groupId, user_id: userId } },
            data: {
                role: updates.role,
                status: updates.status,
            },
        });
        return this.mapMemberToDomain(updated);
    }
    async findActiveMembers(groupId) {
        const all = await this.prisma.study_group_members.findMany({
            where: { group_id: groupId, status: "ACTIVE" },
            include: { users: { select: { id: true, name: true } } },
        });
        return all.map(this.mapMemberToDomain);
    }
    async addContentShare(groupId, contentId, createdBy) {
        await this.prisma.content_shares.create({
            data: {
                content_id: contentId,
                context_type: "STUDY_GROUP",
                context_id: groupId,
                created_by: createdBy,
            },
        });
    }
    async removeContentShare(groupId, contentId) {
        await this.prisma.content_shares.deleteMany({
            where: {
                content_id: contentId,
                context_type: "STUDY_GROUP",
                context_id: groupId,
            },
        });
    }
    async isContentShared(groupId, contentId) {
        const found = await this.prisma.content_shares.findFirst({
            where: {
                content_id: contentId,
                context_type: "STUDY_GROUP",
                context_id: groupId,
            },
        });
        return !!found;
    }
    mapToDomain(item) {
        return new study_group_entity_1.StudyGroup({
            id: item.id,
            name: item.name,
            scopeType: item.scope_type,
            scopeId: item.scope_id,
            ownerId: item.owner_id,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
        });
    }
    mapMemberToDomain(item) {
        return new study_group_entity_1.StudyGroupMember({
            id: item.id,
            groupId: item.group_id,
            userId: item.user_id,
            role: item.role,
            status: item.status,
            joinedAt: item.joined_at,
        });
    }
};
exports.PrismaStudyGroupsRepository = PrismaStudyGroupsRepository;
exports.PrismaStudyGroupsRepository = PrismaStudyGroupsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaStudyGroupsRepository);
//# sourceMappingURL=prisma-study-groups.repository.js.map