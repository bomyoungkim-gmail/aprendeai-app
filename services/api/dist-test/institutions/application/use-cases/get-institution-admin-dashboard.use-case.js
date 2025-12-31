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
exports.GetInstitutionAdminDashboardUseCase = void 0;
const common_1 = require("@nestjs/common");
const institutions_repository_interface_1 = require("../../domain/institutions.repository.interface");
const approvals_repository_interface_1 = require("../../domain/approvals.repository.interface");
const invites_repository_interface_1 = require("../../domain/invites.repository.interface");
const domains_repository_interface_1 = require("../../domain/domains.repository.interface");
let GetInstitutionAdminDashboardUseCase = class GetInstitutionAdminDashboardUseCase {
    constructor(institutionsRepository, approvalsRepository, invitesRepository, domainsRepository) {
        this.institutionsRepository = institutionsRepository;
        this.approvalsRepository = approvalsRepository;
        this.invitesRepository = invitesRepository;
        this.domainsRepository = domainsRepository;
    }
    async execute(userId) {
        const adminMember = await this.institutionsRepository.findAdminMember(userId);
        if (!adminMember) {
            throw new common_1.ForbiddenException("Insufficient permissions");
        }
        const institutionId = adminMember.institutionId;
        const [memberCount, activeInvites, pendingApprovals, domains] = await Promise.all([
            this.institutionsRepository.countMembers(institutionId, "ACTIVE"),
            this.invitesRepository.countActive(institutionId),
            this.approvalsRepository.countPending(institutionId),
            this.domainsRepository.findByInstitution(institutionId),
        ]);
        return Object.assign(Object.assign({}, adminMember.institutions), { memberCount,
            activeInvites,
            pendingApprovals, domains: domains.map((d) => d.domain) });
    }
};
exports.GetInstitutionAdminDashboardUseCase = GetInstitutionAdminDashboardUseCase;
exports.GetInstitutionAdminDashboardUseCase = GetInstitutionAdminDashboardUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(institutions_repository_interface_1.IInstitutionsRepository)),
    __param(1, (0, common_1.Inject)(approvals_repository_interface_1.IApprovalsRepository)),
    __param(2, (0, common_1.Inject)(invites_repository_interface_1.IInvitesRepository)),
    __param(3, (0, common_1.Inject)(domains_repository_interface_1.IDomainsRepository)),
    __metadata("design:paramtypes", [Object, Object, Object, Object])
], GetInstitutionAdminDashboardUseCase);
//# sourceMappingURL=get-institution-admin-dashboard.use-case.js.map