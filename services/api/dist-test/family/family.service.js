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
exports.FamilyService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const subscription_service_1 = require("../billing/subscription.service");
const usage_tracking_service_1 = require("../billing/usage-tracking.service");
const family_repository_interface_1 = require("./domain/family.repository.interface");
const create_family_use_case_1 = require("./application/use-cases/create-family.use-case");
let FamilyService = class FamilyService {
    constructor(prisma, subscriptionService, usageTracking, repository, createFamilyUseCase) {
        this.prisma = prisma;
        this.subscriptionService = subscriptionService;
        this.usageTracking = usageTracking;
        this.repository = repository;
        this.createFamilyUseCase = createFamilyUseCase;
    }
    async create(userId, dto) {
        return this.createFamilyUseCase.execute(userId, dto);
    }
    async findAllForUser(userId) {
        return this.prisma.families.findMany({
            where: {
                family_members: {
                    some: {
                        user_id: userId,
                    },
                },
            },
            include: {
                family_members: {
                    include: {
                        users: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                avatar_url: true,
                            },
                        },
                    },
                },
            },
        });
    }
    async findOne(familyId, userId) {
        const family = await this.prisma.families.findUnique({
            where: { id: familyId },
            include: {
                family_members: {
                    include: {
                        users: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                avatar_url: true,
                            },
                        },
                    },
                },
                users_owner: {
                    select: { id: true, name: true, email: true },
                },
            },
        });
        if (!family) {
            throw new common_1.NotFoundException("Family not found");
        }
        const isMember = family.family_members.some((m) => m.user_id === userId);
        if (!isMember) {
            throw new common_1.ForbiddenException("You are not a member of this family");
        }
        return family;
    }
    async inviteMember(familyId, userId, dto) {
        const family = await this.findOne(familyId, userId);
        const requester = family.family_members.find((m) => m.user_id === userId);
        if (!requester ||
            (requester.role !== "OWNER" && requester.role !== "GUARDIAN")) {
            throw new common_1.ForbiddenException("Only Owners and Guardians can invite members");
        }
        let invitedUser = await this.prisma.users.findUnique({
            where: { email: dto.email },
        });
        if (!invitedUser) {
            console.log(`Inviting new user: ${dto.email}`);
            const { v4: uuidv4 } = require("uuid");
            invitedUser = await this.prisma.users.create({
                data: {
                    id: uuidv4(),
                    email: dto.email,
                    name: dto.displayName || dto.email.split("@")[0],
                    password_hash: "PENDING_INVITE",
                    system_role: "USER",
                    schooling_level: "UNDERGRADUATE",
                    updated_at: new Date(),
                },
            });
        }
        const existingMember = await this.prisma.family_members.findUnique({
            where: {
                family_id_user_id: {
                    family_id: familyId,
                    user_id: invitedUser.id,
                },
            },
        });
        if (existingMember) {
            throw new common_1.ConflictException("User is already a member of this family");
        }
        const { v4: uuidv4 } = require("uuid");
        const newMember = await this.prisma.family_members.create({
            data: {
                id: uuidv4(),
                family_id: familyId,
                user_id: invitedUser.id,
                role: dto.role,
                status: "INVITED",
                display_name: dto.displayName,
            },
            include: {
                users: {
                    select: { id: true, email: true, name: true, avatar_url: true },
                },
            },
        });
        return newMember;
    }
    async removeMember(familyId, userId, memberUserIdToRemove) {
        const family = await this.findOne(familyId, userId);
        const requester = family.family_members.find((m) => m.user_id === userId);
        if (userId !== memberUserIdToRemove && (requester === null || requester === void 0 ? void 0 : requester.role) !== "OWNER") {
            throw new common_1.ForbiddenException("Insufficient permissions to remove member");
        }
        if (family.owner_user_id === memberUserIdToRemove) {
            throw new common_1.BadRequestException("Cannot remove the Family Owner");
        }
        return this.prisma.family_members.delete({
            where: {
                family_id_user_id: {
                    family_id: familyId,
                    user_id: memberUserIdToRemove,
                },
            },
        });
    }
    async acceptInvite(familyId, userId) {
        const member = await this.prisma.family_members.findUnique({
            where: {
                family_id_user_id: {
                    family_id: familyId,
                    user_id: userId,
                },
            },
        });
        if (!member) {
            throw new common_1.NotFoundException("Invite not found");
        }
        if (member.status === "ACTIVE") {
            return member;
        }
        const updatedMember = await this.prisma.family_members.update({
            where: { id: member.id },
            data: { status: "ACTIVE" },
        });
        const user = await this.prisma.users.findUnique({
            where: { id: userId },
            select: { settings: true },
        });
        const currentSettings = (user === null || user === void 0 ? void 0 : user.settings) || {};
        const hasPrimaryFamily = currentSettings.primaryFamilyId;
        if (!hasPrimaryFamily) {
            await this.prisma.users.update({
                where: { id: userId },
                data: {
                    settings: Object.assign(Object.assign({}, currentSettings), { primaryFamilyId: familyId }),
                },
            });
        }
        return updatedMember;
    }
    async getAnalytics(familyId, userId) {
        await this.findOne(familyId, userId);
        const usage = await this.usageTracking.getUsageStats(client_1.ScopeType.FAMILY, familyId, "30d");
        return usage;
    }
    async resolveBillingHierarchy(userId) {
        const hierarchy = [
            { scopeType: client_1.ScopeType.USER, scopeId: userId },
        ];
        const user = await this.prisma.users.findUnique({
            where: { id: userId },
            select: { settings: true },
        });
        const settings = user === null || user === void 0 ? void 0 : user.settings;
        const primaryFamilyId = settings === null || settings === void 0 ? void 0 : settings.primaryFamilyId;
        let member;
        if (primaryFamilyId) {
            member = await this.prisma.family_members.findUnique({
                where: {
                    family_id_user_id: {
                        family_id: primaryFamilyId,
                        user_id: userId,
                    },
                },
            });
            if (member && member.status !== "ACTIVE") {
                member = null;
            }
        }
        if (!member) {
            member = await this.prisma.family_members.findFirst({
                where: { user_id: userId, status: "ACTIVE" },
                select: { family_id: true, id: true, status: true },
            });
        }
        if (member) {
            hierarchy.push({
                scopeType: client_1.ScopeType.FAMILY,
                scopeId: member.family_id,
            });
        }
        return hierarchy;
    }
    async setPrimaryFamily(userId, familyId) {
        const member = await this.prisma.family_members.findUnique({
            where: {
                family_id_user_id: { family_id: familyId, user_id: userId },
            },
        });
        if (!member || member.status !== "ACTIVE") {
            throw new common_1.ForbiddenException("You must be an active member of the family to set it as primary");
        }
        const user = await this.prisma.users.findUnique({ where: { id: userId } });
        const currentSettings = (user === null || user === void 0 ? void 0 : user.settings) || {};
        await this.prisma.users.update({
            where: { id: userId },
            data: {
                settings: Object.assign(Object.assign({}, currentSettings), { primaryFamilyId: familyId }),
            },
        });
        return { success: true };
    }
    async transferOwnership(familyId, currentOwnerId, newOwnerId) {
        const family = await this.findOne(familyId, currentOwnerId);
        if (family.owner_user_id !== currentOwnerId) {
            throw new common_1.ForbiddenException("Only the current owner can transfer ownership");
        }
        if (currentOwnerId === newOwnerId) {
            return { success: true };
        }
        if (process.env.NODE_ENV === "test") {
            console.log("[transferOwnership] Validation:", {
                familyOwnerId: family.owner_user_id,
                currentOwnerId,
                match: family.owner_user_id === currentOwnerId,
                willThrow: family.owner_user_id !== currentOwnerId,
            });
        }
        const newOwnerMember = family.family_members.find((m) => m.user_id === newOwnerId);
        if (!newOwnerMember) {
            throw new common_1.BadRequestException("New owner must be a member of the family");
        }
        return this.prisma.$transaction(async (tx) => {
            await tx.families.update({
                where: { id: familyId },
                data: { owner_user_id: newOwnerId },
            });
            await tx.family_members.update({
                where: {
                    family_id_user_id: { family_id: familyId, user_id: currentOwnerId },
                },
                data: { role: "GUARDIAN" },
            });
            await tx.family_members.update({
                where: {
                    family_id_user_id: { family_id: familyId, user_id: newOwnerId },
                },
                data: { role: "OWNER" },
            });
            return { success: true };
        });
    }
    async deleteFamily(familyId, userId) {
        const family = await this.findOne(familyId, userId);
        if (family.owner_user_id !== userId) {
            throw new common_1.ForbiddenException("Only the owner can delete the family");
        }
        return this.prisma.families.delete({
            where: { id: familyId },
        });
    }
    async getFamilyForOwner(userId) {
        const user = await this.prisma.users.findUnique({
            where: { id: userId },
            select: { settings: true },
        });
        const settings = user === null || user === void 0 ? void 0 : user.settings;
        let familyId = settings === null || settings === void 0 ? void 0 : settings.primaryFamilyId;
        if (!familyId) {
            const member = await this.prisma.family_members.findFirst({
                where: { user_id: userId, status: "ACTIVE" },
                orderBy: { role: "asc" },
            });
            familyId = member === null || member === void 0 ? void 0 : member.family_id;
        }
        if (!familyId) {
            return null;
        }
        const family = await this.prisma.families.findUnique({
            where: { id: familyId },
            include: {
                family_members: {
                    include: {
                        users: {
                            select: { id: true, name: true, email: true, avatar_url: true },
                        },
                    },
                },
            },
        });
        if (!family)
            return null;
        const totalMembers = family.family_members.length;
        const activeMembers = family.family_members.filter((m) => m.status === "ACTIVE").length;
        return Object.assign(Object.assign({}, family), { stats: {
                totalMembers,
                activeMembers,
                plan: "Free",
            } });
    }
};
exports.FamilyService = FamilyService;
exports.FamilyService = FamilyService = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, common_1.Inject)(family_repository_interface_1.IFamilyRepository)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        subscription_service_1.SubscriptionService,
        usage_tracking_service_1.UsageTrackingService, Object, create_family_use_case_1.CreateFamilyUseCase])
], FamilyService);
//# sourceMappingURL=family.service.js.map