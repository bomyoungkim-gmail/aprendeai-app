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
exports.InstitutionDomainService = void 0;
const common_1 = require("@nestjs/common");
const institution_domain_use_case_1 = require("./application/use-cases/institution-domain.use-case");
const domains_repository_interface_1 = require("./domain/domains.repository.interface");
let InstitutionDomainService = class InstitutionDomainService {
    constructor(domainUseCase, repository) {
        this.domainUseCase = domainUseCase;
        this.repository = repository;
    }
    async addDomain(institutionId, dto, addedBy) {
        return this.domainUseCase.addDomain(institutionId, dto, addedBy);
    }
    async findByInstitution(institutionId) {
        return this.repository.findByInstitution(institutionId);
    }
    async removeDomain(domainId, removedBy) {
        return this.domainUseCase.removeDomain(domainId, removedBy);
    }
    async findByEmail(email) {
        return this.domainUseCase.findByEmail(email);
    }
};
exports.InstitutionDomainService = InstitutionDomainService;
exports.InstitutionDomainService = InstitutionDomainService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(domains_repository_interface_1.IDomainsRepository)),
    __metadata("design:paramtypes", [institution_domain_use_case_1.InstitutionDomainUseCase, Object])
], InstitutionDomainService);
//# sourceMappingURL=institution-domain.service.js.map