"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstitutionMember = void 0;
class InstitutionMember {
    constructor(partial) {
        Object.assign(this, partial);
        this.joinedAt = partial.joinedAt || new Date();
    }
}
exports.InstitutionMember = InstitutionMember;
//# sourceMappingURL=institution-member.entity.js.map