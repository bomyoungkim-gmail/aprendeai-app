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
exports.InstitutionsService = void 0;
const common_1 = require("@nestjs/common");
const institutions_repository_interface_1 = require("./domain/institutions.repository.interface");
const get_institution_admin_dashboard_use_case_1 = require("./application/use-cases/get-institution-admin-dashboard.use-case");
const institution_entity_1 = require("./domain/institution.entity");
const uuid_1 = require("uuid");
let InstitutionsService = class InstitutionsService {
    constructor(repository, getAdminDashboardUseCase) {
        this.repository = repository;
        this.getAdminDashboardUseCase = getAdminDashboardUseCase;
    }
    async create(dto) {
        const institution = new institution_entity_1.Institution(Object.assign({ id: (0, uuid_1.v4)() }, dto));
        return this.repository.create(institution);
    }
    findAll() {
        return this.repository.findAll();
    }
    findOne(id) {
        return this.repository.findById(id);
    }
    update(id, dto) {
        return this.repository.update(id, dto);
    }
    remove(id) {
        return this.repository.delete(id);
    }
    async getInstitutionForAdmin(userId) {
        return this.getAdminDashboardUseCase.execute(userId);
    }
};
exports.InstitutionsService = InstitutionsService;
exports.InstitutionsService = InstitutionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(institutions_repository_interface_1.IInstitutionsRepository)),
    __metadata("design:paramtypes", [Object, get_institution_admin_dashboard_use_case_1.GetInstitutionAdminDashboardUseCase])
], InstitutionsService);
//# sourceMappingURL=institutions.service.js.map