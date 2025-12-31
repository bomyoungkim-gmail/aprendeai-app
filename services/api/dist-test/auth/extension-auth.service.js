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
exports.ExtensionAuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto_1 = require("crypto");
const extension_auth_dto_1 = require("./dto/extension-auth.dto");
const urls_config_1 = require("../config/urls.config");
const auth_claims_adapter_1 = require("./domain/auth-claims.adapter");
let ExtensionAuthService = class ExtensionAuthService {
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async startDeviceCode(scopes) {
        const validScopes = scopes.filter((s) => extension_auth_dto_1.EXTENSION_SCOPES.includes(s));
        if (validScopes.length === 0) {
            validScopes.push("extension:webclip:create", "extension:session:start");
        }
        const deviceCode = "dev_" + (0, crypto_1.randomBytes)(32).toString("hex");
        const userCode = this.generateUserCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await this.prisma.extension_device_auth.create({
            data: {
                id: (0, crypto_1.randomUUID)(),
                device_code: deviceCode,
                user_code: userCode,
                requested_scopes: validScopes,
                expires_at: expiresAt,
                status: "PENDING",
                updated_at: new Date(),
            },
        });
        const frontendUrl = urls_config_1.URL_CONFIG.frontend.verify;
        return {
            deviceCode,
            userCode,
            verificationUrl: frontendUrl,
            expiresInSec: 600,
            pollIntervalSec: 3,
        };
    }
    async pollDeviceCode(deviceCode) {
        const auth = await this.prisma.extension_device_auth.findUnique({
            where: { device_code: deviceCode },
        });
        if (!auth) {
            return { status: "INVALID" };
        }
        if (auth.expires_at < new Date()) {
            await this.prisma.extension_device_auth.update({
                where: { id: auth.id },
                data: { status: "EXPIRED" },
            });
            return { status: "EXPIRED" };
        }
        if (auth.status === "PENDING") {
            return { status: "PENDING", retryAfterSec: 3 };
        }
        if (auth.status === "DENIED") {
            return { status: "DENIED" };
        }
        if (auth.status === "APPROVED" && auth.user_id) {
            const tokens = await this.generateTokens(auth.user_id, auth.client_id, auth.requested_scopes);
            await this.prisma.extension_device_auth.delete({
                where: { id: auth.id },
            });
            return {
                status: "APPROVED",
                tokenType: "Bearer",
                accessToken: tokens.accessToken,
                expiresInSec: 900,
                refreshToken: tokens.refreshToken,
                scope: auth.requested_scopes.join(" "),
            };
        }
        return { status: "PENDING", retryAfterSec: 3 };
    }
    async approveDeviceCode(userCode, userId, approve) {
        const auth = await this.prisma.extension_device_auth.findUnique({
            where: { user_code: userCode },
        });
        if (!auth) {
            throw new common_1.BadRequestException("Invalid user code");
        }
        if (auth.expires_at < new Date()) {
            throw new common_1.BadRequestException("Code expired");
        }
        if (auth.status !== "PENDING") {
            throw new common_1.BadRequestException("Code already processed");
        }
        await this.prisma.extension_device_auth.update({
            where: { id: auth.id },
            data: {
                status: approve ? "APPROVED" : "DENIED",
                user_id: approve ? userId : null,
            },
        });
        return { ok: true };
    }
    async refreshToken(refreshToken) {
        const grant = await this.prisma.extension_grants.findUnique({
            where: { refresh_token: refreshToken },
        });
        if (!grant || grant.revoked_at) {
            throw new common_1.UnauthorizedException("Invalid or revoked refresh token");
        }
        await this.prisma.extension_grants.update({
            where: { id: grant.id },
            data: { last_used_at: new Date() },
        });
        const user = await this.prisma.users.findUnique({
            where: { id: grant.user_id },
        });
        if (!user) {
            throw new common_1.UnauthorizedException("User not found");
        }
        const claims = (0, auth_claims_adapter_1.buildClaimsV2)({
            id: user.id,
            email: user.email,
            systemRole: user.system_role,
            contextRole: user.last_context_role,
            institutionId: user.last_institution_id,
            scopes: grant.scopes,
            clientId: grant.client_id,
        });
        const accessToken = this.jwtService.sign(claims, { expiresIn: "15m" });
        const jti = this.extractJti(accessToken);
        await this.prisma.extension_grants.update({
            where: { id: grant.id },
            data: { access_token_jti: jti },
        });
        return {
            accessToken,
            expiresInSec: 900,
            tokenType: "Bearer",
        };
    }
    async revokeGrant(grantId, userId) {
        const grant = await this.prisma.extension_grants.findFirst({
            where: { id: grantId, user_id: userId },
        });
        if (!grant) {
            throw new common_1.BadRequestException("Grant not found");
        }
        await this.prisma.extension_grants.update({
            where: { id: grantId },
            data: { revoked_at: new Date() },
        });
        return { ok: true };
    }
    async getExtensionUserInfo(userId) {
        var _a;
        const user = await this.prisma.users.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException("User not found");
        }
        return {
            userId: user.id,
            name: user.name,
            email: (_a = user.email) === null || _a === void 0 ? void 0 : _a.replace(/(.{2}).*(@.*)/, "$1***$2"),
        };
    }
    async generateTokens(userId, clientId, scopes) {
        const user = await this.prisma.users.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.UnauthorizedException("User not found");
        }
        const claims = (0, auth_claims_adapter_1.buildClaimsV2)({
            id: user.id,
            email: user.email,
            systemRole: user.system_role,
            contextRole: user.last_context_role,
            institutionId: user.last_institution_id,
            scopes,
            clientId,
        });
        const accessToken = this.jwtService.sign(claims, { expiresIn: "15m" });
        const refreshToken = "rft_" + (0, crypto_1.randomBytes)(32).toString("hex");
        const jti = this.extractJti(accessToken);
        await this.prisma.extension_grants.create({
            data: {
                id: (0, crypto_1.randomUUID)(),
                user_id: userId,
                client_id: clientId,
                scopes,
                access_token_jti: jti,
                refresh_token: refreshToken,
            },
        });
        return { accessToken, refreshToken };
    }
    generateUserCode() {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let code = "";
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        code += "-";
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }
    extractJti(token) {
        try {
            const decoded = this.jwtService.decode(token);
            return (decoded === null || decoded === void 0 ? void 0 : decoded.jti) || token.substring(0, 16);
        }
        catch (_a) {
            return token.substring(0, 16);
        }
    }
};
exports.ExtensionAuthService = ExtensionAuthService;
exports.ExtensionAuthService = ExtensionAuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], ExtensionAuthService);
//# sourceMappingURL=extension-auth.service.js.map