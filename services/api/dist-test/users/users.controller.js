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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
const users_service_1 = require("./users.service");
const user_dto_1 = require("./dto/user.dto");
const user_mapper_1 = require("./infrastructure/user.mapper");
const get_profile_use_case_1 = require("./application/get-profile.use-case");
const update_profile_use_case_1 = require("./application/update-profile.use-case");
let UsersController = class UsersController {
    constructor(usersService, getProfileUseCase, updateProfileUseCase) {
        this.usersService = usersService;
        this.getProfileUseCase = getProfileUseCase;
        this.updateProfileUseCase = updateProfileUseCase;
    }
    async getCurrentUser(req) {
        return this.getProfileUseCase.execute(req.user.id);
    }
    async getUserContext(req) {
        return this.usersService.getUserContext(req.user.id);
    }
    async updateProfile(req, updateDto) {
        return this.updateProfileUseCase.execute(req.user.id, updateDto);
    }
    async uploadAvatar(req, file) {
        if (!file) {
            throw new common_1.BadRequestException("No file uploaded");
        }
        const avatarUrl = `/uploads/avatars/${req.user.id}-${Date.now()}.${file.mimetype.split("/")[1]}`;
        const user = await this.usersService.updateAvatar(req.user.id, avatarUrl);
        return user_mapper_1.UserMapper.toDto(user);
    }
    async getStats(req) {
        return this.usersService.getStats(req.user.id);
    }
    async getActivity(req) {
        return this.usersService.getActivity(req.user.id);
    }
    async getSettings(req) {
        return this.usersService.getSettings(req.user.id);
    }
    async getEntitlements(req) {
        return {
            id: "default",
            userId: req.user.id,
            source: "DIRECT",
            planType: "FREE",
            limits: {
                maxContentsPerMonth: 10,
                maxStorageMB: 100,
            },
            features: {
                aiAssistant: false,
                advancedAnalytics: false,
            },
            effectiveAt: new Date(),
            expiresAt: null,
            updatedAt: new Date(),
        };
    }
    async updateSettings(req, settingsDto) {
        const user = await this.usersService.updateSettings(req.user.id, settingsDto);
        return user_mapper_1.UserMapper.toDto(user);
    }
    async changePassword(req, changePasswordDto) {
        return this.usersService.changePassword(req.user.id, changePasswordDto.currentPassword, changePasswordDto.newPassword);
    }
    async deleteAccount(req, body) {
        return this.usersService.deleteAccount(req.user.id, body.password);
    }
    async exportData(req) {
        return {
            message: "Data export will be sent to your email",
            status: "processing",
        };
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)("me"),
    (0, swagger_1.ApiOperation)({ summary: "Get current user profile" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Returns user profile" }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getCurrentUser", null);
__decorate([
    (0, common_1.Get)("me/context"),
    (0, swagger_1.ApiOperation)({ summary: "Get user context for browser extension" }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "Returns user context with family/institution info",
    }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getUserContext", null);
__decorate([
    (0, common_1.Put)("me"),
    (0, swagger_1.ApiOperation)({ summary: "Update user profile" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Profile updated successfully" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, user_dto_1.UpdateProfileDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Post)("me/avatar"),
    (0, swagger_1.ApiOperation)({ summary: "Upload user avatar" }),
    (0, swagger_1.ApiConsumes)("multipart/form-data"),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("avatar", {
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (req, file, callback) => {
            if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
                return callback(new common_1.BadRequestException("Only image files are allowed"), false);
            }
            callback(null, true);
        },
    })),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "uploadAvatar", null);
__decorate([
    (0, common_1.Get)("me/stats"),
    (0, swagger_1.ApiOperation)({ summary: "Get user statistics" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Returns user stats" }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)("me/activity"),
    (0, swagger_1.ApiOperation)({ summary: "Get user recent activity" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Returns recent activity" }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getActivity", null);
__decorate([
    (0, common_1.Get)("me/settings"),
    (0, swagger_1.ApiOperation)({ summary: "Get user settings" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Returns user settings" }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Get)("me/entitlements"),
    (0, swagger_1.ApiOperation)({ summary: "Get user entitlements" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Returns user entitlements" }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getEntitlements", null);
__decorate([
    (0, common_1.Patch)("me/settings"),
    (0, swagger_1.ApiOperation)({ summary: "Update user settings" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Settings updated successfully" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, user_dto_1.UpdateSettingsDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.Put)("me/password"),
    (0, swagger_1.ApiOperation)({ summary: "Change user password" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Password changed successfully" }),
    (0, swagger_1.ApiResponse)({ status: 401, description: "Current password is incorrect" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, user_dto_1.ChangePasswordDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Delete)("me"),
    (0, swagger_1.ApiOperation)({ summary: "Delete user account" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Account deleted successfully" }),
    (0, swagger_1.ApiResponse)({ status: 401, description: "Password is incorrect" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "deleteAccount", null);
__decorate([
    (0, common_1.Post)("me/export"),
    (0, swagger_1.ApiOperation)({ summary: "Export user data (GDPR)" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Data export initiated" }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "exportData", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)("users"),
    (0, common_1.Controller)("users"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt")),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        get_profile_use_case_1.GetProfileUseCase,
        update_profile_use_case_1.UpdateProfileUseCase])
], UsersController);
//# sourceMappingURL=users.controller.js.map