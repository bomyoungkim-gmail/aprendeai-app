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
exports.ExtensionScopeGuard = exports.RequireExtensionScopes = exports.EXTENSION_SCOPES_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const common_2 = require("@nestjs/common");
exports.EXTENSION_SCOPES_KEY = "extension_scopes";
const RequireExtensionScopes = (...scopes) => (0, common_2.SetMetadata)(exports.EXTENSION_SCOPES_KEY, scopes);
exports.RequireExtensionScopes = RequireExtensionScopes;
let ExtensionScopeGuard = class ExtensionScopeGuard {
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const requiredScopes = this.reflector.getAllAndOverride(exports.EXTENSION_SCOPES_KEY, [context.getHandler(), context.getClass()]);
        if (!requiredScopes || requiredScopes.length === 0) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!(user === null || user === void 0 ? void 0 : user.scopes)) {
            throw new common_1.ForbiddenException("Extension scopes required");
        }
        const hasScope = requiredScopes.some((scope) => user.scopes.includes(scope));
        if (!hasScope) {
            throw new common_1.ForbiddenException(`Missing required scope(s): ${requiredScopes.join(", ")}`);
        }
        return true;
    }
};
exports.ExtensionScopeGuard = ExtensionScopeGuard;
exports.ExtensionScopeGuard = ExtensionScopeGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], ExtensionScopeGuard);
//# sourceMappingURL=extension-scope.guard.js.map