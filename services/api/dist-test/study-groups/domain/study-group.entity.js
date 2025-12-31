"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudyGroupMember = exports.StudyGroup = void 0;
class StudyGroup {
    constructor(partial) {
        Object.assign(this, partial);
        this.createdAt = partial.createdAt || new Date();
        this.updatedAt = partial.updatedAt || new Date();
    }
}
exports.StudyGroup = StudyGroup;
class StudyGroupMember {
    constructor(partial) {
        Object.assign(this, partial);
        this.joinedAt = partial.joinedAt || new Date();
    }
}
exports.StudyGroupMember = StudyGroupMember;
//# sourceMappingURL=study-group.entity.js.map