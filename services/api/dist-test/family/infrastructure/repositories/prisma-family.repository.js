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
exports.PrismaFamilyRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const family_entity_1 = require("../../domain/family.entity");
let PrismaFamilyRepository = class PrismaFamilyRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(family) {
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
    async findById(id) {
        const found = await this.prisma.families.findUnique({
            where: { id },
            include: {
                family_members: {
                    include: { users: { select: { id: true, name: true, email: true, avatar_url: true } } }
                },
                users_owner: { select: { id: true, name: true, email: true } }
            }
        });
        return found ? this.mapToDomain(found) : null;
    }
    async findByUser(userId) {
        const memberships = await this.prisma.family_members.findMany({
            where: { user_id: userId },
            include: { families: { include: { family_members: true } } }
        });
        return memberships.map(m => this.mapToDomain(m.families));
    }
    async update(id, updates) {
        const updated = await this.prisma.families.update({
            where: { id },
            data: {
                name: updates.name,
                owner_user_id: updates.ownerUserId,
                updated_at: new Date(),
            }
        });
        return this.mapToDomain(updated);
    }
    async delete(id) {
        await this.prisma.families.delete({ where: { id } });
    }
    async addMember(member) {
        const created = await this.prisma.family_members.create({
            data: {
                id: member.id,
                family_id: member.familyId,
                user_id: member.userId,
                role: member.role,
                status: member.status,
                display_name: member.displayName,
            }
        });
        return this.mapMemberToDomain(created);
    }
    async findMember(familyId, userId) {
        const found = await this.prisma.family_members.findUnique({
            where: { family_id_user_id: { family_id: familyId, user_id: userId } }
        });
        return found ? this.mapMemberToDomain(found) : null;
    }
    async updateMember(familyId, userId, updates) {
        const updated = await this.prisma.family_members.update({
            where: { family_id_user_id: { family_id: familyId, user_id: userId } },
            data: {
                role: updates.role,
                status: updates.status,
                display_name: updates.displayName,
            }
        });
        return this.mapMemberToDomain(updated);
    }
    async deleteMember(familyId, userId) {
        await this.prisma.family_members.delete({
            where: { family_id_user_id: { family_id: familyId, user_id: userId } }
        });
    }
    async findAll() {
        const families = await this.prisma.families.findMany({
            include: {
                family_members: {
                    include: {
                        users: true,
                    },
                },
            },
        });
        return families.map(f => this.mapToDomain(f));
    }
    mapToDomain(item) {
        var _a;
        return new family_entity_1.Family({
            id: item.id,
            name: item.name,
            ownerUserId: item.owner_user_id,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
            members: (_a = item.family_members) === null || _a === void 0 ? void 0 : _a.map((m) => this.mapMemberToDomain(m)),
        });
    }
    mapMemberToDomain(item) {
        return new family_entity_1.FamilyMember({
            id: item.id,
            familyId: item.family_id,
            userId: item.user_id,
            role: item.role,
            status: item.status,
            displayName: item.display_name,
            joinedAt: item.joined_at,
            user: item.users ? {
                email: item.users.email,
                name: item.users.name,
            } : undefined,
        });
    }
};
exports.PrismaFamilyRepository = PrismaFamilyRepository;
exports.PrismaFamilyRepository = PrismaFamilyRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaFamilyRepository);
//# sourceMappingURL=prisma-family.repository.js.map