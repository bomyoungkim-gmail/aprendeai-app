"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstitutionInvite = void 0;
class InstitutionInvite {
    constructor(partial) {
        Object.assign(this, partial);
        this.createdAt = partial.createdAt || new Date();
    }
    isExpired() {
        return this.expiresAt < new Date();
    }
    isUsed() {
        return !!this.usedAt;
    }
}
exports.InstitutionInvite = InstitutionInvite;
//# sourceMappingURL=institution-invite.entity.js.map