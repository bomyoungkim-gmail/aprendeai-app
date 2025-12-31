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
exports.PrismaDomainsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const domains_repository_interface_1 = require("../../domain/domains.repository.interface");
let PrismaDomainsRepository = class PrismaDomainsRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(domain) {
        const created = await this.prisma.institution_domains.create({
            data: {
                id: domain.id,
                institution_id: domain.institutionId,
                domain: domain.domain,
                auto_approve: domain.autoApprove,
                default_role: domain.defaultRole,
            },
        });
        return this.mapToDomain(created);
    }
    async findByDomain(domain) {
        const found = await this.prisma.institution_domains.findUnique({
            where: { domain: domain.toLowerCase() },
            include: { institutions: true },
        });
        return found ? this.mapToDomain(found) : null;
    }
    async findByInstitution(institutionId) {
        const all = await this.prisma.institution_domains.findMany({
            where: { institution_id: institutionId },
            orderBy: { created_at: "desc" },
        });
        return all.map(this.mapToDomain);
    }
    async findById(id) {
        const found = await this.prisma.institution_domains.findUnique({
            where: { id },
        });
        return found ? this.mapToDomain(found) : null;
    }
    async delete(id) {
        await this.prisma.institution_domains.delete({ where: { id } });
    }
    async update(id, updates) {
        const updated = await this.prisma.institution_domains.update({
            where: { id },
            data: {
                auto_approve: updates.autoApprove,
                default_role: updates.defaultRole,
            },
        });
        return this.mapToDomain(updated);
    }
    mapToDomain(item) {
        return new domains_repository_interface_1.InstitutionDomain({
            id: item.id,
            institutionId: item.institution_id,
            domain: item.domain,
            autoApprove: item.auto_approve,
            defaultRole: item.default_role,
            createdAt: item.created_at,
        });
    }
};
exports.PrismaDomainsRepository = PrismaDomainsRepository;
exports.PrismaDomainsRepository = PrismaDomainsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaDomainsRepository);
//# sourceMappingURL=prisma-domains.repository.js.map