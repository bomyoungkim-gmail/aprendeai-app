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
var AuthController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_dto_1 = require("../dto/auth.dto");
const switch_context_dto_1 = require("../dto/switch-context.dto");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
const public_decorator_1 = require("./decorators/public.decorator");
const urls_config_1 = require("../../config/urls.config");
const login_use_case_1 = require("../application/login.use-case");
const register_use_case_1 = require("../application/register.use-case");
const refresh_token_use_case_1 = require("../application/refresh-token.use-case");
const switch_context_use_case_1 = require("../application/switch-context.use-case");
const forgot_password_use_case_1 = require("../application/forgot-password.use-case");
const reset_password_use_case_1 = require("../application/reset-password.use-case");
const token_generator_service_1 = require("../infrastructure/token-generator.service");
let AuthController = AuthController_1 = class AuthController {
    constructor(loginUseCase, registerUseCase, refreshTokenUseCase, switchContextUseCase, forgotPasswordUseCase, resetPasswordUseCase, tokenGenerator) {
        this.loginUseCase = loginUseCase;
        this.registerUseCase = registerUseCase;
        this.refreshTokenUseCase = refreshTokenUseCase;
        this.switchContextUseCase = switchContextUseCase;
        this.forgotPasswordUseCase = forgotPasswordUseCase;
        this.resetPasswordUseCase = resetPasswordUseCase;
        this.tokenGenerator = tokenGenerator;
        this.logger = new common_1.Logger(AuthController_1.name);
    }
    async register(registerDto, inviteToken) {
        this.logger.log(`New user registration attempt: ${registerDto.email}`);
        return this.registerUseCase.execute(registerDto, inviteToken);
    }
    async login(loginDto) {
        this.logger.log(`Login attempt: ${loginDto.email}`);
        return this.loginUseCase.execute(loginDto.email, loginDto.password);
    }
    async refresh(body) {
        this.logger.log("Token refresh attempt");
        return this.refreshTokenUseCase.execute(body.refresh_token);
    }
    getProfile(req) {
        return req.user;
    }
    googleLogin() { }
    async googleCallback(req, res) {
        const token = await this.tokenGenerator.generateTokenSet(req.user);
        const frontendUrl = urls_config_1.URL_CONFIG.frontend.base;
        res.redirect(`${frontendUrl}/auth/callback?token=${token.access_token}`);
    }
    microsoftLogin() { }
    async microsoftCallback(req, res) {
        const token = await this.tokenGenerator.generateTokenSet(req.user);
        const frontendUrl = urls_config_1.URL_CONFIG.frontend.base;
        res.redirect(`${frontendUrl}/auth/callback?token=${token.access_token}`);
    }
    async forgotPassword(dto) {
        await this.forgotPasswordUseCase.execute(dto.email);
        return { message: "If the email exists, a reset link has been sent." };
    }
    async resetPassword(dto) {
        return this.resetPasswordUseCase.execute(dto);
    }
    async switchContext(req, body) {
        this.logger.log(`Context switch request: user=${req.user.id}, target=${body.activeInstitutionId}`);
        const target = body.activeInstitutionId || null;
        return this.switchContextUseCase.execute(req.user.id, target);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)("register"),
    (0, swagger_1.ApiOperation)({ summary: "Register a new user" }),
    (0, swagger_1.ApiResponse)({ status: 201, description: "User successfully registered" }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "Bad request - validation failed" }),
    (0, swagger_1.ApiBody)({ type: auth_dto_1.RegisterDto }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)("inviteToken")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.RegisterDto, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)("login"),
    (0, swagger_1.ApiOperation)({ summary: "Login with email and password" }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "Login successful, returns JWT token",
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: "Invalid credentials" }),
    (0, swagger_1.ApiBody)({ type: auth_dto_1.LoginDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)("refresh"),
    (0, swagger_1.ApiOperation)({ summary: "Refresh access token using refresh token" }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "Token refreshed successfully, returns new access token",
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: "Invalid or expired refresh token" }),
    (0, swagger_1.ApiBody)({ schema: { properties: { refresh_token: { type: "string" } } } }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Get)("profile"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt")),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get current user profile" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Returns user profile" }),
    (0, swagger_1.ApiResponse)({ status: 401, description: "Unauthorized" }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getProfile", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)("google"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("google")),
    (0, swagger_1.ApiOperation)({ summary: "Initiate Google OAuth login" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "googleLogin", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)("google/callback"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("google")),
    (0, swagger_1.ApiOperation)({ summary: "Google OAuth callback" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleCallback", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)("microsoft"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("microsoft")),
    (0, swagger_1.ApiOperation)({ summary: "Initiate Microsoft OAuth login" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "microsoftLogin", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)("microsoft/callback"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("microsoft")),
    (0, swagger_1.ApiOperation)({ summary: "Microsoft OAuth callback" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "microsoftCallback", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)("forgot-password"),
    (0, swagger_1.ApiOperation)({ summary: "Request password reset email" }),
    (0, swagger_1.ApiBody)({ schema: { properties: { email: { type: "string" } } } }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)("reset-password"),
    (0, swagger_1.ApiOperation)({ summary: "Reset password using token" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Post)("switch-context"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt")),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Switch active institution context" }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "Context switched successfully, returns new JWT with updated activeInstitutionId",
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: "Unauthorized - Invalid membership",
    }),
    (0, swagger_1.ApiBody)({ type: switch_context_dto_1.SwitchContextDto }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, switch_context_dto_1.SwitchContextDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "switchContext", null);
exports.AuthController = AuthController = AuthController_1 = __decorate([
    (0, swagger_1.ApiTags)("auth"),
    (0, common_1.Controller)("auth"),
    __metadata("design:paramtypes", [login_use_case_1.LoginUseCase,
        register_use_case_1.RegisterUseCase,
        refresh_token_use_case_1.RefreshTokenUseCase,
        switch_context_use_case_1.SwitchContextUseCase,
        forgot_password_use_case_1.ForgotPasswordUseCase,
        reset_password_use_case_1.ResetPasswordUseCase,
        token_generator_service_1.TokenGeneratorService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map