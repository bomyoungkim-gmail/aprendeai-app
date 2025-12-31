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
exports.PrismaInstitutionsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const institution_entity_1 = require("../../domain/institution.entity");
const institution_member_entity_1 = require("../../domain/institution-member.entity");
let PrismaInstitutionsRepository = class PrismaInstitutionsRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(institution) {
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
    async findById(id) {
        const found = await this.prisma.institutions.findUnique({
            where: { id },
            include: { classrooms: true },
        });
        return found ? this.mapToDomain(found) : null;
    }
    async findAll() {
        const all = await this.prisma.institutions.findMany();
        return all.map(this.mapToDomain);
    }
    async update(id, updates) {
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
    async delete(id) {
        await this.prisma.institutions.delete({ where: { id } });
    }
    async addMember(member) {
        const created = await this.prisma.institution_members.create({
            data: {
                id: member.id,
                institution_id: member.institutionId,
                user_id: member.userId,
                role: member.role,
                status: member.status,
            },
        });
        return this.mapMemberToDomain(created);
    }
    async findMember(institutionId, userId) {
        const found = await this.prisma.institution_members.findFirst({
            where: { institution_id: institutionId, user_id: userId },
        });
        return found ? this.mapMemberToDomain(found) : null;
    }
    async findAdminMember(userId) {
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
        if (!found)
            return null;
        const domainMember = this.mapMemberToDomain(found);
        return Object.assign(Object.assign({}, domainMember), { institutions: this.mapToDomain(found.institutions) });
    }
    async countMembers(institutionId, status) {
        return this.prisma.institution_members.count({
            where: { institution_id: institutionId, status: status },
        });
    }
    mapToDomain(item) {
        return new institution_entity_1.Institution({
            id: item.id,
            name: item.name,
            type: item.type,
            logoUrl: item.logo_url,
            settings: item.settings,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
        });
    }
    mapMemberToDomain(item) {
        return new institution_member_entity_1.InstitutionMember({
            id: item.id,
            institutionId: item.institution_id,
            userId: item.user_id,
            role: item.role,
            status: item.status,
            joinedAt: item.joined_at,
        });
    }
};
exports.PrismaInstitutionsRepository = PrismaInstitutionsRepository;
exports.PrismaInstitutionsRepository = PrismaInstitutionsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaInstitutionsRepository);
//# sourceMappingURL=prisma-institutions.repository.js.map