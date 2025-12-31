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
exports.PrismaInvitesRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const institution_invite_entity_1 = require("../../domain/institution-invite.entity");
let PrismaInvitesRepository = class PrismaInvitesRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(invite) {
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
    async findByToken(token) {
        const found = await this.prisma.institution_invites.findUnique({
            where: { token },
            include: {
                institutions: true,
                users: { select: { id: true, name: true, email: true } },
            },
        });
        return found ? this.mapToDomain(found) : null;
    }
    async findById(id) {
        const found = await this.prisma.institution_invites.findUnique({
            where: { id },
        });
        return found ? this.mapToDomain(found) : null;
    }
    async findByInstitution(institutionId) {
        const all = await this.prisma.institution_invites.findMany({
            where: { institution_id: institutionId },
            include: {
                users: { select: { id: true, name: true, email: true } },
            },
            orderBy: { created_at: "desc" },
        });
        return all.map(this.mapToDomain);
    }
    async update(id, updates) {
        const updated = await this.prisma.institution_invites.update({
            where: { id },
            data: {
                used_at: updates.usedAt,
                expires_at: updates.expiresAt,
            },
        });
        return this.mapToDomain(updated);
    }
    async delete(id) {
        await this.prisma.institution_invites.delete({ where: { id } });
    }
    async countActive(institutionId) {
        return this.prisma.institution_invites.count({
            where: {
                institution_id: institutionId,
                used_at: null,
                expires_at: { gt: new Date() },
            },
        });
    }
    async invalidatePrevious(institutionId, email) {
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
    mapToDomain(item) {
        return new institution_invite_entity_1.InstitutionInvite({
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
};
exports.PrismaInvitesRepository = PrismaInvitesRepository;
exports.PrismaInvitesRepository = PrismaInvitesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaInvitesRepository);
//# sourceMappingURL=prisma-invites.repository.js.map