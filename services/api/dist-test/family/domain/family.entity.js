"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FamilyMember = exports.Family = void 0;
class Family {
    constructor(partial) {
        Object.assign(this, partial);
        this.createdAt = partial.createdAt || new Date();
        this.updatedAt = partial.updatedAt || new Date();
    }
}
exports.Family = Family;
class FamilyMember {
    constructor(partial) {
        Object.assign(this, partial);
        this.joinedAt = partial.joinedAt || new Date();
    }
}
exports.FamilyMember = FamilyMember;
//# sourceMappingURL=family.entity.js.map