"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var TenantGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantGuard = void 0;
const common_1 = require("@nestjs/common");
const request_context_1 = require("../context/request-context");
let TenantGuard = TenantGuard_1 = class TenantGuard {
    constructor() {
        this.logger = new common_1.Logger(TenantGuard_1.name);
    }
    canActivate(context) {
        var _a, _b, _c;
        const request = context.switchToHttp().getRequest();
        const user = (0, request_context_1.getCurrentUser)();
        if (!user) {
            return true;
        }
        const resourceTenantId = ((_a = request.params) === null || _a === void 0 ? void 0 : _a.institutionId) ||
            ((_b = request.body) === null || _b === void 0 ? void 0 : _b.institutionId) ||
            ((_c = request.query) === null || _c === void 0 ? void 0 : _c.institutionId);
        if (!resourceTenantId) {
            return true;
        }
        if (user.institutionId !== resourceTenantId) {
            this.logger.warn(`Cross-tenant access denied: user ${user.id} (institution ${user.institutionId}) ` +
                `attempted to access resource in institution ${resourceTenantId}`);
            throw new common_1.ForbiddenException("Access denied: cross-tenant access not allowed");
        }
        return true;
    }
};
exports.TenantGuard = TenantGuard;
exports.TenantGuard = TenantGuard = TenantGuard_1 = __decorate([
    (0, common_1.Injectable)()
], TenantGuard);
//# sourceMappingURL=tenant.guard.js.map