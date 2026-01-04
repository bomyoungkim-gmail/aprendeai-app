"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const institution_invite_service_1 = require("../../src/institutions/institution-invite.service");
const prisma_service_1 = require("../../src/prisma/prisma.service");
const email_service_1 = require("../../src/email/email.service");
const admin_service_1 = require("../../src/admin/admin.service");
const common_1 = require("@nestjs/common");
describe("InstitutionInviteService (Unit)", () => {
    let service;
    let prismaService;
    let emailService;
    let adminService;
    const mockPrismaService = {
        users: {
            findUnique: jest.fn(),
        },
        institution_invites: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
            delete: jest.fn(),
        },
        institutions: {
            findUnique: jest.fn(),
        },
    };
    const mockEmailService = {
        sendEmail: jest.fn().mockResolvedValue(undefined),
    };
    const mockAdminService = {
        createAuditLog: jest.fn().mockResolvedValue(undefined),
    };
    beforeEach(async () => {
        process.env.FRONTEND_URL = "http://localhost:3000";
        const module = await testing_1.Test.createTestingModule({
            providers: [
                institution_invite_service_1.InstitutionInviteService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
                { provide: email_service_1.EmailService, useValue: mockEmailService },
                { provide: admin_service_1.AdminService, useValue: mockAdminService },
            ],
        }).compile();
        service = module.get(institution_invite_service_1.InstitutionInviteService);
        prismaService = module.get(prisma_service_1.PrismaService);
        emailService = module.get(email_service_1.EmailService);
        adminService = module.get(admin_service_1.AdminService);
        jest.clearAllMocks();
    });
    describe("create()", () => {
        const institutionId = "inst-123";
        const invitedBy = "admin-123";
        const dto = {
            email: "teacher@escola.com",
            role: "TEACHER",
            expiresInDays: 7,
        };
        const createdInvite = {
            id: "invite-id",
            institution_id: institutionId,
            email: dto.email,
            role: dto.role,
            token: "crypto-token-123",
            expires_at: new Date(),
            used_at: null,
            invited_by: invitedBy,
            created_at: new Date(),
            institutions: {
                id: institutionId,
                name: "Escola Teste",
            },
            users: {
                id: invitedBy,
                name: "Admin User",
                email: "admin@escola.com",
            },
        };
        it("should create invite with crypto-secure token", async () => {
            mockPrismaService.users.findUnique.mockResolvedValue(null);
            mockPrismaService.institution_invites.updateMany.mockResolvedValue({
                count: 0,
            });
            mockPrismaService.institution_invites.create.mockResolvedValue(createdInvite);
            const result = await service.create(institutionId, dto, invitedBy);
            expect(result).toHaveProperty("id");
            expect(result).toHaveProperty("email", dto.email);
            expect(result).toHaveProperty("inviteUrl");
            expect(result.inviteUrl).toContain("token=");
        });
        it("should invalidate previous unused invites", async () => {
            mockPrismaService.users.findUnique.mockResolvedValue(null);
            mockPrismaService.institution_invites.updateMany.mockResolvedValue({
                count: 1,
            });
            mockPrismaService.institution_invites.create.mockResolvedValue(createdInvite);
            await service.create(institutionId, dto, invitedBy);
            expect(mockPrismaService.institution_invites.updateMany).toHaveBeenCalledWith({
                where: {
                    institution_id: institutionId,
                    email: dto.email.toLowerCase(),
                    used_at: null,
                },
                data: {
                    expires_at: expect.any(Date),
                },
            });
        });
        it("should throw ConflictException if user already exists", async () => {
            mockPrismaService.users.findUnique.mockResolvedValue({
                id: "existing-user",
                email: dto.email,
            });
            await expect(service.create(institutionId, dto, invitedBy)).rejects.toThrow(common_1.ConflictException);
        });
        it("should send invitation email", async () => {
            mockPrismaService.users.findUnique.mockResolvedValue(null);
            mockPrismaService.institution_invites.updateMany.mockResolvedValue({
                count: 0,
            });
            mockPrismaService.institution_invites.create.mockResolvedValue(createdInvite);
            await service.create(institutionId, dto, invitedBy);
            expect(emailService.sendEmail).toHaveBeenCalledWith({
                to: dto.email,
                subject: expect.stringContaining("Escola Teste"),
                template: "institution-invite",
                context: expect.objectContaining({
                    institutionName: "Escola Teste",
                    inviterName: "Admin User",
                    role: dto.role,
                }),
            });
        });
        it("should create audit log", async () => {
            mockPrismaService.users.findUnique.mockResolvedValue(null);
            mockPrismaService.institution_invites.updateMany.mockResolvedValue({
                count: 0,
            });
            mockPrismaService.institution_invites.create.mockResolvedValue(createdInvite);
            await service.create(institutionId, dto, invitedBy);
            expect(adminService.createAuditLog).toHaveBeenCalledWith({
                actorUserId: invitedBy,
                action: "INVITE_TO_INSTITUTION",
                resourceType: "InstitutionInvite",
                resourceId: "invite-id",
                afterJson: expect.any(Object),
            });
        });
    });
    describe("validate()", () => {
        it("should return valid=true for valid token", async () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            mockPrismaService.institution_invites.findUnique.mockResolvedValue({
                id: "invite-id",
                token: "valid-token",
                email: "test@test.com",
                role: "TEACHER",
                expires_at: tomorrow,
                used_at: null,
                institutions: {
                    id: "inst-123",
                    name: "Test Institution",
                },
            });
            const result = await service.validate("valid-token");
            expect(result.valid).toBe(true);
            expect(result).toHaveProperty("institutionId");
            expect(result).toHaveProperty("institutionName");
        });
        it("should return invalid for non-existent token", async () => {
            mockPrismaService.institution_invites.findUnique.mockResolvedValue(null);
            const result = await service.validate("invalid-token");
            expect(result.valid).toBe(false);
            expect(result.message).toBe("Invalid token");
        });
        it("should return invalid for used token", async () => {
            mockPrismaService.institution_invites.findUnique.mockResolvedValue({
                id: "invite-id",
                token: "used-token",
                used_at: new Date(),
                expires_at: new Date(),
            });
            const result = await service.validate("used-token");
            expect(result.valid).toBe(false);
            expect(result.message).toBe("Invite already used");
        });
        it("should return invalid for expired token", async () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            mockPrismaService.institution_invites.findUnique.mockResolvedValue({
                id: "invite-id",
                token: "expired-token",
                expires_at: yesterday,
                used_at: null,
            });
            const result = await service.validate("expired-token");
            expect(result.valid).toBe(false);
            expect(result.message).toBe("Invite expired");
        });
    });
    describe("markAsUsed()", () => {
        it("should update invite with used_at timestamp", async () => {
            const inviteId = "invite-id";
            mockPrismaService.institution_invites.update.mockResolvedValue({
                id: inviteId,
                used_at: new Date(),
            });
            await service.markAsUsed(inviteId);
            expect(mockPrismaService.institution_invites.update).toHaveBeenCalledWith({
                where: { id: inviteId },
                data: { used_at: expect.any(Date) },
            });
        });
    });
    describe("delete()", () => {
        const inviteId = "invite-123";
        const deletedBy = "admin-123";
        it("should delete invite and create audit log", async () => {
            const invite = {
                id: inviteId,
                email: "test@test.com",
                institution_id: "inst-123",
            };
            mockPrismaService.institution_invites.findUnique.mockResolvedValue(invite);
            mockPrismaService.institution_invites.delete.mockResolvedValue(invite);
            const result = await service.delete(inviteId, deletedBy);
            expect(result.message).toContain("success");
            expect(adminService.createAuditLog).toHaveBeenCalledWith({
                actorUserId: deletedBy,
                action: "CANCEL_INSTITUTION_INVITE",
                resourceType: "InstitutionInvite",
                resourceId: inviteId,
                beforeJson: invite,
            });
        });
        it("should throw NotFoundException if invite not found", async () => {
            mockPrismaService.institution_invites.findUnique.mockResolvedValue(null);
            await expect(service.delete(inviteId, deletedBy)).rejects.toThrow(common_1.NotFoundException);
        });
    });
});
//# sourceMappingURL=institution-invite.service.spec.js.map