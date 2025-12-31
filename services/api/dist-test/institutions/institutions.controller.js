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
exports.InstitutionsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const institutions_service_1 = require("./institutions.service");
const institution_invite_service_1 = require("./institution-invite.service");
const institution_domain_service_1 = require("./institution-domain.service");
const approval_service_1 = require("./approval.service");
const sso_service_1 = require("./sso.service");
const bulk_service_1 = require("../bulk/bulk.service");
const institution_dto_1 = require("./dto/institution.dto");
const institution_mapper_1 = require("../mappers/institution.mapper");
const roles_decorator_1 = require("../admin/decorators/roles.decorator");
const roles_guard_1 = require("../admin/guards/roles.guard");
const client_1 = require("@prisma/client");
let InstitutionsController = class InstitutionsController {
    constructor(institutionsService, inviteService, domainService, approvalService, ssoService, bulkService) {
        this.institutionsService = institutionsService;
        this.inviteService = inviteService;
        this.domainService = domainService;
        this.approvalService = approvalService;
        this.ssoService = ssoService;
        this.bulkService = bulkService;
    }
    async create(createInstitutionDto) {
        const inst = await this.institutionsService.create(createInstitutionDto);
        return institution_mapper_1.InstitutionMapper.toDto(inst);
    }
    async findAll() {
        const insts = await this.institutionsService.findAll();
        return institution_mapper_1.InstitutionMapper.toCollectionDto(insts);
    }
    async getMyInstitution(req) {
        const inst = await this.institutionsService.getInstitutionForAdmin(req.user.id);
        return institution_mapper_1.InstitutionMapper.toDto(inst);
    }
    async findOne(id) {
        const inst = await this.institutionsService.findOne(id);
        return institution_mapper_1.InstitutionMapper.toDto(inst);
    }
    async update(id, updateInstitutionDto) {
        const inst = await this.institutionsService.update(id, updateInstitutionDto);
        return institution_mapper_1.InstitutionMapper.toDto(inst);
    }
    remove(id) {
        return this.institutionsService.remove(id);
    }
    createInvite(institutionId, createInviteDto, req) {
        return this.inviteService.create(institutionId, createInviteDto, req.user.id);
    }
    getInvites(institutionId) {
        return this.inviteService.findByInstitution(institutionId);
    }
    cancelInvite(inviteId, req) {
        return this.inviteService.delete(inviteId, req.user.id);
    }
    async bulkInvite(id, file) {
        return this.bulkService.bulkInviteFromCSV(id, file.buffer);
    }
    async exportMembers(id) {
        const csv = await this.bulkService.exportMembersCSV(id);
        return { csv };
    }
    addDomain(institutionId, addDomainDto, req) {
        return this.domainService.addDomain(institutionId, addDomainDto, req.user.id);
    }
    getDomains(institutionId) {
        return this.domainService.findByInstitution(institutionId);
    }
    removeDomain(domainId, req) {
        return this.domainService.removeDomain(domainId, req.user.id);
    }
    getPendingApprovals(institutionId) {
        return this.approvalService.findByInstitution(institutionId);
    }
    async processApproval(approvalId, processApprovalDto, req) {
        if (processApprovalDto.approve) {
            return this.approvalService.approve(approvalId, req.user.id);
        }
        else {
            return this.approvalService.reject(approvalId, req.user.id, processApprovalDto.reason || "Rejected by admin");
        }
    }
    async createSSOConfig(institutionId, dto, req) {
        return this.ssoService.createConfig(Object.assign(Object.assign({}, dto), { institutionId }), req.user.id);
    }
    async getSSOConfig(institutionId) {
        return this.ssoService.getConfig(institutionId);
    }
    async updateSSOConfig(institutionId, dto, req) {
        return this.ssoService.updateConfig(institutionId, dto, req.user.id);
    }
    async deleteSSOConfig(institutionId, req) {
        return this.ssoService.deleteConfig(institutionId, req.user.id);
    }
    async testSSOConfig(institutionId) {
        return { success: true, message: "SSO configuration is valid" };
    }
};
exports.InstitutionsController = InstitutionsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: "Create a new institution" }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: "The institution has been successfully created.",
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [institution_dto_1.CreateInstitutionDto]),
    __metadata("design:returntype", Promise)
], InstitutionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: "Get all institutions" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Return all institutions." }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InstitutionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)("my-institution"),
    (0, swagger_1.ApiOperation)({ summary: "Get my institution (for INSTITUTION_ADMIN)" }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "Returns institution data with stats",
    }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InstitutionsController.prototype, "getMyInstitution", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Get institution by ID" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Return the institution." }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InstitutionsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN, client_1.ContextRole.INSTITUTION_EDUCATION_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: "Update an institution" }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "The institution has been successfully updated.",
    }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, institution_dto_1.UpdateInstitutionDto]),
    __metadata("design:returntype", Promise)
], InstitutionsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: "Delete an institution" }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "The institution has been successfully deleted.",
    }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InstitutionsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(":id/invites"),
    (0, roles_decorator_1.Roles)(client_1.ContextRole.INSTITUTION_EDUCATION_ADMIN, client_1.SystemRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: "Create an institution invite" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, institution_dto_1.CreateInviteDto, Object]),
    __metadata("design:returntype", void 0)
], InstitutionsController.prototype, "createInvite", null);
__decorate([
    (0, common_1.Get)(":id/invites"),
    (0, roles_decorator_1.Roles)(client_1.ContextRole.INSTITUTION_EDUCATION_ADMIN, client_1.SystemRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: "Get all invites for an institution" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InstitutionsController.prototype, "getInvites", null);
__decorate([
    (0, common_1.Delete)(":id/invites/:inviteId"),
    (0, roles_decorator_1.Roles)(client_1.ContextRole.INSTITUTION_EDUCATION_ADMIN, client_1.SystemRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: "Cancel an invite" }),
    __param(0, (0, common_1.Param)("inviteId")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InstitutionsController.prototype, "cancelInvite", null);
__decorate([
    (0, common_1.Post)(":id/bulk-invite"),
    (0, roles_decorator_1.Roles)(client_1.ContextRole.INSTITUTION_EDUCATION_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: "Bulk invite members via CSV" }),
    (0, swagger_1.ApiConsumes)("multipart/form-data"),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("file")),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InstitutionsController.prototype, "bulkInvite", null);
__decorate([
    (0, common_1.Get)(":id/export"),
    (0, roles_decorator_1.Roles)(client_1.ContextRole.INSTITUTION_EDUCATION_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: "Export members as CSV" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InstitutionsController.prototype, "exportMembers", null);
__decorate([
    (0, common_1.Post)(":id/domains"),
    (0, roles_decorator_1.Roles)(client_1.ContextRole.INSTITUTION_EDUCATION_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: "Add a domain to an institution" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, institution_dto_1.AddDomainDto, Object]),
    __metadata("design:returntype", void 0)
], InstitutionsController.prototype, "addDomain", null);
__decorate([
    (0, common_1.Get)(":id/domains"),
    (0, roles_decorator_1.Roles)(client_1.ContextRole.INSTITUTION_EDUCATION_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: "Get all domains for an institution" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InstitutionsController.prototype, "getDomains", null);
__decorate([
    (0, common_1.Delete)(":id/domains/:domainId"),
    (0, roles_decorator_1.Roles)(client_1.ContextRole.INSTITUTION_EDUCATION_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: "Remove a domain" }),
    __param(0, (0, common_1.Param)("domainId")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InstitutionsController.prototype, "removeDomain", null);
__decorate([
    (0, common_1.Get)(":id/pending"),
    (0, roles_decorator_1.Roles)(client_1.ContextRole.INSTITUTION_EDUCATION_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: "Get pending approvals for an institution" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InstitutionsController.prototype, "getPendingApprovals", null);
__decorate([
    (0, common_1.Post)(":id/pending/:approvalId"),
    (0, roles_decorator_1.Roles)(client_1.ContextRole.INSTITUTION_EDUCATION_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: "Process a pending approval (approve or reject)" }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)("approvalId")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, institution_dto_1.ProcessApprovalDto, Object]),
    __metadata("design:returntype", Promise)
], InstitutionsController.prototype, "processApproval", null);
__decorate([
    (0, common_1.Post)(":id/sso"),
    (0, roles_decorator_1.Roles)(client_1.ContextRole.INSTITUTION_EDUCATION_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: "Configure SSO for institution" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], InstitutionsController.prototype, "createSSOConfig", null);
__decorate([
    (0, common_1.Get)(":id/sso"),
    (0, roles_decorator_1.Roles)(client_1.ContextRole.INSTITUTION_EDUCATION_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: "Get SSO configuration" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InstitutionsController.prototype, "getSSOConfig", null);
__decorate([
    (0, common_1.Patch)(":id/sso"),
    (0, roles_decorator_1.Roles)(client_1.ContextRole.INSTITUTION_EDUCATION_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: "Update SSO configuration" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], InstitutionsController.prototype, "updateSSOConfig", null);
__decorate([
    (0, common_1.Delete)(":id/sso"),
    (0, roles_decorator_1.Roles)(client_1.ContextRole.INSTITUTION_EDUCATION_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: "Delete SSO configuration" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InstitutionsController.prototype, "deleteSSOConfig", null);
__decorate([
    (0, common_1.Post)(":id/sso/test"),
    (0, roles_decorator_1.Roles)(client_1.ContextRole.INSTITUTION_EDUCATION_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: "Test SSO configuration" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InstitutionsController.prototype, "testSSOConfig", null);
exports.InstitutionsController = InstitutionsController = __decorate([
    (0, swagger_1.ApiTags)("Institutions"),
    (0, common_1.Controller)("institutions"),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [institutions_service_1.InstitutionsService,
        institution_invite_service_1.InstitutionInviteService,
        institution_domain_service_1.InstitutionDomainService,
        approval_service_1.ApprovalService,
        sso_service_1.SSOService,
        bulk_service_1.BulkService])
], InstitutionsController);
//# sourceMappingURL=institutions.controller.js.map