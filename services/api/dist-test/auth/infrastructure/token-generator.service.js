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
exports.TokenGeneratorService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const auth_claims_adapter_1 = require("../domain/auth-claims.adapter");
let TokenGeneratorService = class TokenGeneratorService {
    constructor(jwtService) {
        this.jwtService = jwtService;
    }
    generateTokenSet(user) {
        const claims = (0, auth_claims_adapter_1.buildClaimsV2)({
            id: user.id,
            email: user.email,
            systemRole: user.systemRole,
            contextRole: user.contextRole,
            institutionId: user.institutionId,
        });
        const access_token = this.jwtService.sign(claims, { expiresIn: "15m" });
        const refresh_token = this.jwtService.sign({ sub: user.id, type: "refresh" }, { expiresIn: "7d" });
        return {
            access_token,
            refresh_token,
            user: this.mapToDto(user),
        };
    }
    generateAccessToken(user) {
        const claims = (0, auth_claims_adapter_1.buildClaimsV2)({
            id: user.id,
            email: user.email,
            systemRole: user.systemRole,
            contextRole: user.contextRole,
            institutionId: user.institutionId,
        });
        return this.jwtService.sign(claims, { expiresIn: "15m" });
    }
    mapToDto(user) {
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            systemRole: user.systemRole,
            contextRole: user.contextRole,
            institutionId: user.institutionId,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
};
exports.TokenGeneratorService = TokenGeneratorService;
exports.TokenGeneratorService = TokenGeneratorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], TokenGeneratorService);
//# sourceMappingURL=token-generator.service.js.map