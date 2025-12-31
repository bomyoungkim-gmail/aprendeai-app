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
exports.InstitutionInviteUseCase = void 0;
const common_1 = require("@nestjs/common");
const invites_repository_interface_1 = require("../../domain/invites.repository.interface");
const institutions_repository_interface_1 = require("../../domain/institutions.repository.interface");
const email_service_1 = require("../../../email/email.service");
const admin_service_1 = require("../../../admin/admin.service");
const prisma_service_1 = require("../../../prisma/prisma.service");
const institution_invite_entity_1 = require("../../domain/institution-invite.entity");
const crypto = require("crypto");
const uuid_1 = require("uuid");
let InstitutionInviteUseCase = class InstitutionInviteUseCase {
    constructor(invitesRepository, institutionsRepository, prisma, emailService, adminService) {
        this.invitesRepository = invitesRepository;
        this.institutionsRepository = institutionsRepository;
        this.prisma = prisma;
        this.emailService = emailService;
        this.adminService = adminService;
    }
    async create(institutionId, dto, invitedBy) {
        const token = crypto.randomBytes(32).toString("hex");
        const expiresInDays = dto.expiresInDays || 7;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresInDays);
        const existingUser = await this.prisma.users.findUnique({
            where: { email: dto.email.toLowerCase() },
        });
        if (existingUser) {
            throw new common_1.ConflictException("User with this email already exists");
        }
        await this.invitesRepository.invalidatePrevious(institutionId, dto.email);
        const invite = new institution_invite_entity_1.InstitutionInvite({
            id: (0, uuid_1.v4)(),
            institutionId,
            email: dto.email.toLowerCase(),
            role: dto.role,
            token,
            expiresAt,
            invitedBy,
        });
        const created = await this.invitesRepository.create(invite);
        const institution = await this.institutionsRepository.findById(institutionId);
        const inviter = await this.prisma.users.findUnique({
            where: { id: invitedBy },
            select: { name: true }
        });
        const inviteUrl = `${process.env.FRONTEND_URL}/register/invite?token=${token}`;
        await this.emailService.sendEmail({
            to: dto.email,
            subject: `Convite para ${institution === null || institution === void 0 ? void 0 : institution.name}`,
            template: "institution-invite",
            context: {
                institutionName: institution === null || institution === void 0 ? void 0 : institution.name,
                inviterName: inviter === null || inviter === void 0 ? void 0 : inviter.name,
                inviteUrl,
                expiresAt,
                role: dto.role,
            },
        });
        await this.adminService.createAuditLog({
            actorUserId: invitedBy,
            action: "INVITE_TO_INSTITUTION",
            resourceType: "InstitutionInvite",
            resourceId: created.id,
            afterJson: {
                email: dto.email,
                role: dto.role,
                institutionId,
                expiresAt,
            },
        });
        return {
            id: created.id,
            email: created.email,
            role: created.role,
            expiresAt: created.expiresAt,
            inviteUrl,
        };
    }
    async validate(token) {
        const invite = await this.invitesRepository.findByToken(token);
        if (!invite) {
            return { valid: false, message: "Invalid token" };
        }
        if (invite.isUsed()) {
            return { valid: false, message: "Invite already used" };
        }
        if (invite.isExpired()) {
            return { valid: false, message: "Invite expired" };
        }
        const institution = await this.institutionsRepository.findById(invite.institutionId);
        return {
            valid: true,
            id: invite.id,
            institutionId: invite.institutionId,
            institutionName: institution === null || institution === void 0 ? void 0 : institution.name,
            email: invite.email,
            role: invite.role,
            expiresAt: invite.expiresAt,
        };
    }
};
exports.InstitutionInviteUseCase = InstitutionInviteUseCase;
exports.InstitutionInviteUseCase = InstitutionInviteUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(invites_repository_interface_1.IInvitesRepository)),
    __param(1, (0, common_1.Inject)(institutions_repository_interface_1.IInstitutionsRepository)),
    __metadata("design:paramtypes", [Object, Object, prisma_service_1.PrismaService,
        email_service_1.EmailService,
        admin_service_1.AdminService])
], InstitutionInviteUseCase);
//# sourceMappingURL=institution-invite.use-case.js.map