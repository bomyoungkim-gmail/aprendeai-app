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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = require("bcrypt");
const uuid_1 = require("uuid");
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findOne(email) {
        return this.prisma.users.findUnique({
            where: { email },
            include: {
                institution_members: {
                    include: { institutions: true },
                },
            },
        });
    }
    async findById(id) {
        return this.prisma.users.findUnique({ where: { id } });
    }
    async getUserContext(userId) {
        var _a, _b, _c, _d;
        const user = (await this.prisma.users.findUnique({
            where: { id: userId },
            select: {
                id: true,
                last_context_role: true,
                institution_members: {
                    select: {
                        institution_id: true,
                        role: true,
                    },
                    where: { status: "ACTIVE" },
                },
                family_members: {
                    select: {
                        family_id: true,
                        role: true,
                        families: {
                            select: {
                                family_members: true,
                            },
                        },
                    },
                },
            },
        }));
        if (!user)
            throw new common_1.NotFoundException("User not found");
        return {
            userId: user.id,
            role: user.last_context_role,
            institutionId: (_a = user.institution_members[0]) === null || _a === void 0 ? void 0 : _a.institution_id,
            institutionRole: (_b = user.institution_members[0]) === null || _b === void 0 ? void 0 : _b.role,
            familyId: (_c = user.family_members[0]) === null || _c === void 0 ? void 0 : _c.family_id,
            familyRole: (_d = user.family_members[0]) === null || _d === void 0 ? void 0 : _d.role,
            contentFilters: {
                minAge: 3,
                maxAge: 18,
            },
            screenTimeLimit: null,
        };
    }
    async createUser(data) {
        const salt = await bcrypt.genSalt();
        const password_hash = await bcrypt.hash(data.password_hash, salt);
        return this.prisma.users.create({
            data: Object.assign(Object.assign({ id: (0, uuid_1.v4)() }, data), { password_hash, updated_at: new Date() }),
        });
    }
    async updateProfile(userId, updateDto) {
        const user = await this.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException("User not found");
        }
        return this.prisma.users.update({
            where: { id: userId },
            data: Object.assign(Object.assign({}, updateDto), { updated_at: new Date() }),
        });
    }
    async updateAvatar(userId, avatarUrl) {
        return this.prisma.users.update({
            where: { id: userId },
            data: { avatar_url: avatarUrl },
        });
    }
    async getStats(userId) {
        const [contentsCount, annotationsCount, groupsCount] = await Promise.all([
            this.prisma.contents.count({ where: { owner_user_id: userId } }),
            this.prisma.annotations.count({ where: { user_id: userId } }),
            this.prisma.study_group_members.count({ where: { user_id: userId } }),
        ]);
        const user = await this.prisma.users.findUnique({
            where: { id: userId },
            include: {
                study_group_members: {
                    include: {
                        study_groups: {
                            include: {
                                group_sessions: true,
                            },
                        },
                    },
                },
            },
        });
        const sessionsCount = (user === null || user === void 0 ? void 0 : user.study_group_members.flatMap((m) => m.study_groups.group_sessions).length) || 0;
        return {
            contentsRead: contentsCount,
            annotationsCreated: annotationsCount,
            groupsJoined: groupsCount,
            sessionsAttended: sessionsCount,
            studyHours: 0,
        };
    }
    async getActivity(userId, limit = 10) {
        const recentAnnotations = await this.prisma.annotations.findMany({
            where: { user_id: userId },
            orderBy: { created_at: "desc" },
            take: limit,
            include: {
                contents: {
                    select: { title: true },
                },
            },
        });
        const recentGroups = await this.prisma.study_group_members.findMany({
            where: { user_id: userId },
            orderBy: { joined_at: "desc" },
            take: limit,
            include: {
                study_groups: {
                    select: { name: true },
                },
            },
        });
        const activities = [
            ...recentAnnotations.map((a) => ({
                type: "annotation",
                description: `Annotated "${a.contents.title}"`,
                timestamp: a.created_at,
            })),
            ...recentGroups.map((g) => ({
                type: "group_join",
                description: `Joined "${g.study_groups.name}"`,
                timestamp: g.joined_at,
            })),
        ]
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
        return activities;
    }
    async getSettings(userId) {
        const user = await this.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException("User not found");
        }
        return (user.settings || {
            notifications: {
                email: true,
                groupInvites: true,
                annotations: true,
                sessionReminders: true,
                weeklyDigest: false,
            },
            privacy: {
                profileVisible: true,
                showStats: true,
                allowEmailDiscovery: true,
            },
        });
    }
    async updateSettings(userId, settingsDto) {
        const currentSettings = (await this.getSettings(userId));
        const updatedSettings = Object.assign(Object.assign({}, currentSettings), { notifications: Object.assign(Object.assign({}, currentSettings.notifications), settingsDto.notifications), privacy: Object.assign(Object.assign({}, currentSettings.privacy), settingsDto.privacy) });
        return this.prisma.users.update({
            where: { id: userId },
            data: { settings: updatedSettings },
        });
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await this.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException("User not found");
        }
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException("Current password is incorrect");
        }
        const salt = await bcrypt.genSalt();
        const newPasswordHash = await bcrypt.hash(newPassword, salt);
        await this.prisma.users.update({
            where: { id: userId },
            data: {
                password_hash: newPasswordHash,
                updated_at: new Date(),
            },
        });
        return { message: "Password changed successfully" };
    }
    async deleteAccount(userId, password) {
        const user = await this.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException("User not found");
        }
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException("Password is incorrect");
        }
        await this.prisma.users.delete({
            where: { id: userId },
        });
        return { message: "Account deleted successfully" };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map