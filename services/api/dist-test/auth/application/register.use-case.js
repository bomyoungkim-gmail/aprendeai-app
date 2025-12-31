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
exports.RegisterUseCase = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = require("bcrypt");
const uuid_1 = require("uuid");
const prisma_service_1 = require("../../prisma/prisma.service");
const users_repository_interface_1 = require("../../users/domain/users.repository.interface");
const institution_invite_service_1 = require("../../institutions/institution-invite.service");
const institution_domain_service_1 = require("../../institutions/institution-domain.service");
const approval_service_1 = require("../../institutions/approval.service");
const email_service_1 = require("../../email/email.service");
const subscription_service_1 = require("../../billing/subscription.service");
let RegisterUseCase = class RegisterUseCase {
    constructor(prisma, usersRepository, inviteService, domainService, approvalService, emailService, subscriptionService) {
        this.prisma = prisma;
        this.usersRepository = usersRepository;
        this.inviteService = inviteService;
        this.domainService = domainService;
        this.approvalService = approvalService;
        this.emailService = emailService;
        this.subscriptionService = subscriptionService;
    }
    async execute(registerDto, inviteToken) {
        const existingUser = await this.usersRepository.findByEmail(registerDto.email);
        if (existingUser) {
            throw new common_1.ConflictException("User already exists");
        }
        if (inviteToken) {
            return this.registerWithInvite(registerDto, inviteToken);
        }
        const domainConfig = await this.domainService.findByEmail(registerDto.email);
        if (domainConfig) {
            if (domainConfig.autoApprove) {
                return this.registerWithInstitution(registerDto, domainConfig);
            }
            else {
                return this.approvalService.createPending(domainConfig.institutionId, registerDto.email, registerDto.name, registerDto.password, domainConfig.defaultRole);
            }
        }
        return this.registerNormalUser(registerDto);
    }
    async registerWithInvite(registerDto, token) {
        const invite = await this.inviteService.findByToken(token);
        if (!invite || !invite.valid) {
            throw new common_1.UnauthorizedException((invite === null || invite === void 0 ? void 0 : invite.message) || "Invalid or expired invite");
        }
        if (invite.email.toLowerCase() !== registerDto.email.toLowerCase()) {
            throw new common_1.UnauthorizedException("Email does not match invite");
        }
        const user = await this.prisma.$transaction(async (tx) => {
            const passwordHash = await bcrypt.hash(registerDto.password, 10);
            const newUser = await tx.users.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    name: registerDto.name,
                    email: registerDto.email,
                    password_hash: passwordHash,
                    last_institution_id: String(invite.institutionId),
                    schooling_level: "ADULT",
                    status: "ACTIVE",
                    updated_at: new Date(),
                },
            });
            await tx.institution_members.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    institution_id: String(invite.institutionId),
                    user_id: newUser.id,
                    role: invite.role,
                    status: "ACTIVE",
                },
            });
            await this.subscriptionService.createFreeSubscription(newUser.id);
            await tx.institution_invites.update({
                where: { id: invite.id },
                data: { used_at: new Date() },
            });
            return newUser;
        });
        this.sendWelcomeEmail(user.email, user.name);
        return user;
    }
    async registerWithInstitution(registerDto, domainConfig) {
        const user = await this.prisma.$transaction(async (tx) => {
            const passwordHash = await bcrypt.hash(registerDto.password, 10);
            const newUser = await tx.users.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    name: registerDto.name,
                    email: registerDto.email,
                    password_hash: passwordHash,
                    last_institution_id: domainConfig.institutionId,
                    schooling_level: "ADULT",
                    status: "ACTIVE",
                    updated_at: new Date(),
                },
            });
            await tx.institution_members.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    institution_id: domainConfig.institutionId,
                    user_id: newUser.id,
                    role: domainConfig.defaultRole,
                    status: "ACTIVE",
                },
            });
            await this.subscriptionService.createFreeSubscription(newUser.id);
            return newUser;
        });
        this.sendWelcomeEmail(user.email, user.name);
        return user;
    }
    async registerNormalUser(registerDto) {
        const user = await this.prisma.$transaction(async (tx) => {
            const passwordHash = await bcrypt.hash(registerDto.password, 10);
            const newUser = await tx.users.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    name: registerDto.name,
                    email: registerDto.email,
                    password_hash: passwordHash,
                    last_context_role: "OWNER",
                    schooling_level: "ADULT",
                    status: "ACTIVE",
                    updated_at: new Date(),
                },
            });
            await this.subscriptionService.createFreeSubscription(newUser.id);
            return newUser;
        });
        this.sendWelcomeEmail(user.email, user.name);
        return user;
    }
    sendWelcomeEmail(email, name) {
        this.emailService.sendWelcomeEmail({ email, name }).catch((error) => {
            console.error("Failed to send welcome email:", error);
        });
    }
};
exports.RegisterUseCase = RegisterUseCase;
exports.RegisterUseCase = RegisterUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(users_repository_interface_1.IUsersRepository)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object, institution_invite_service_1.InstitutionInviteService,
        institution_domain_service_1.InstitutionDomainService,
        approval_service_1.ApprovalService,
        email_service_1.EmailService,
        subscription_service_1.SubscriptionService])
], RegisterUseCase);
//# sourceMappingURL=register.use-case.js.map