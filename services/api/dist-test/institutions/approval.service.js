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
exports.ApprovalService = void 0;
const common_1 = require("@nestjs/common");
const process_user_approval_use_case_1 = require("./application/use-cases/process-user-approval.use-case");
const approvals_repository_interface_1 = require("./domain/approvals.repository.interface");
const pending_approval_entity_1 = require("./domain/pending-approval.entity");
const uuid_1 = require("uuid");
const email_service_1 = require("../email/email.service");
const prisma_service_1 = require("../prisma/prisma.service");
let ApprovalService = class ApprovalService {
    constructor(processApprovalUseCase, repository, emailService, prisma) {
        this.processApprovalUseCase = processApprovalUseCase;
        this.repository = repository;
        this.emailService = emailService;
        this.prisma = prisma;
    }
    async createPending(institutionId, email, name, password, requestedRole) {
        const bcrypt = require("bcrypt");
        const tempPasswordHash = await bcrypt.hash(password, 10);
        const pending = new pending_approval_entity_1.PendingApproval({
            id: (0, uuid_1.v4)(),
            institutionId,
            email: email.toLowerCase(),
            name,
            tempPasswordHash,
            requestedRole,
            status: "PENDING",
        });
        const created = await this.repository.create(pending);
        return { status: "pending_approval", approvalId: created.id };
    }
    async approve(approvalId, reviewedBy) {
        return this.processApprovalUseCase.approve(approvalId, reviewedBy);
    }
    async reject(approvalId, reviewedBy, reason) {
        return this.processApprovalUseCase.reject(approvalId, reviewedBy, reason);
    }
    async findByInstitution(institutionId) {
        return this.repository.findByInstitution(institutionId, "PENDING");
    }
};
exports.ApprovalService = ApprovalService;
exports.ApprovalService = ApprovalService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(approvals_repository_interface_1.IApprovalsRepository)),
    __metadata("design:paramtypes", [process_user_approval_use_case_1.ProcessUserApprovalUseCase, Object, email_service_1.EmailService,
        prisma_service_1.PrismaService])
], ApprovalService);
//# sourceMappingURL=approval.service.js.map