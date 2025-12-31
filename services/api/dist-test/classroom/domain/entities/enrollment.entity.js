"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Enrollment = void 0;
class Enrollment {
    constructor(id, classroomId, learnerUserId, nickname, status = 'ACTIVE', enrolledAt = new Date()) {
        this.id = id;
        this.classroomId = classroomId;
        this.learnerUserId = learnerUserId;
        this.nickname = nickname;
        this.status = status;
        this.enrolledAt = enrolledAt;
    }
}
exports.Enrollment = Enrollment;
//# sourceMappingURL=enrollment.entity.js.map