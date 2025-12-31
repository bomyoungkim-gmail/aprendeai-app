"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildClaimsV2 = buildClaimsV2;
function buildClaimsV2(params) {
    return Object.assign(Object.assign({ sub: params.id, email: params.email, systemRole: params.systemRole, contextRole: params.contextRole, institutionId: params.institutionId || null }, (params.scopes && { scopes: params.scopes })), (params.clientId && { clientId: params.clientId }));
}
//# sourceMappingURL=auth-claims.adapter.js.map