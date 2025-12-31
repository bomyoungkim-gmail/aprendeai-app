"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Classroom = void 0;
class Classroom {
    constructor(id, name, ownerEducatorId, institutionId, gradeLevel, updatedAt = new Date()) {
        this.id = id;
        this.name = name;
        this.ownerEducatorId = ownerEducatorId;
        this.institutionId = institutionId;
        this.gradeLevel = gradeLevel;
        this.updatedAt = updatedAt;
    }
}
exports.Classroom = Classroom;
//# sourceMappingURL=classroom.entity.js.map