"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudySession = void 0;
class StudySession {
    constructor(partial) {
        Object.assign(this, partial);
        this.startTime = partial.startTime || new Date();
    }
    isFinished() {
        return !!this.endTime;
    }
}
exports.StudySession = StudySession;
//# sourceMappingURL=study-session.entity.js.map