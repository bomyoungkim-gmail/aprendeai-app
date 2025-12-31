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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstitutionDomainUseCase = void 0;
const common_1 = require("@nestjs/common");
const domains_repository_interface_1 = require("../../domain/domains.repository.interface");
const admin_service_1 = require("../../../admin/admin.service");
const users_repository_interface_1 = require("../../../users/domain/users.repository.interface");
const uuid_1 = require("uuid");
let InstitutionDomainUseCase = class InstitutionDomainUseCase {
    constructor(domainsRepository, adminService, usersRepository) {
        this.domainsRepository = domainsRepository;
        this.adminService = adminService;
        this.usersRepository = usersRepository;
    }
    async addDomain(institutionId, dto, addedBy) {
        const domainPattern = /^@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!domainPattern.test(dto.domain)) {
            throw new common_1.BadRequestException("Invalid domain format. Must be @domain.com");
        }
        const existing = await this.domainsRepository.findByDomain(dto.domain);
        if (existing) {
            throw new common_1.ConflictException("Domain already registered to another institution");
        }
        const domain = new domains_repository_interface_1.InstitutionDomain({
            id: (0, uuid_1.v4)(),
            institutionId,
            domain: dto.domain.toLowerCase(),
            autoApprove: dto.autoApprove,
            defaultRole: dto.defaultRole,
        });
        const created = await this.domainsRepository.create(domain);
        await this.adminService.createAuditLog({
            actorUserId: addedBy,
            action: "ADD_INSTITUTION_DOMAIN",
            resourceType: "InstitutionDomain",
            resourceId: created.id,
            afterJson: dto,
        });
        return created;
    }
    async removeDomain(domainId, removedBy) {
        const domain = await this.domainsRepository.findById(domainId);
        if (!domain) {
            throw new common_1.BadRequestException("Domain not found");
        }
        const usersCount = await this.usersRepository.countUsersByDomain(domain.domain.substring(1), domain.institutionId);
        if (usersCount > 0) {
            throw new common_1.ConflictException(`Cannot remove domain with ${usersCount} active users`);
        }
        await this.domainsRepository.delete(domainId);
        await this.adminService.createAuditLog({
            actorUserId: removedBy,
            action: "REMOVE_INSTITUTION_DOMAIN",
            resourceType: "InstitutionDomain",
            resourceId: domainId,
            beforeJson: domain,
        });
        return { message: "Domain removed successfully" };
    }
    async findByEmail(email) {
        const domainPart = email.split("@")[1];
        if (!domainPart)
            return null;
        return this.domainsRepository.findByDomain(`@${domainPart}`);
    }
};
exports.InstitutionDomainUseCase = InstitutionDomainUseCase;
exports.InstitutionDomainUseCase = InstitutionDomainUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(domains_repository_interface_1.IDomainsRepository)),
    __param(2, (0, common_1.Inject)(users_repository_interface_1.IUsersRepository)),
    __metadata("design:paramtypes", [Object, admin_service_1.AdminService, Object])
], InstitutionDomainUseCase);
//# sourceMappingURL=institution-domain.use-case.js.map