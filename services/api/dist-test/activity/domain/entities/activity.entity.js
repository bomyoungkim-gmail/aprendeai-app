"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Activity = void 0;
class Activity {
    constructor(id, userId, date, minutesStudied = 0, sessionsCount = 0, contentsRead = 0, annotationsCreated = 0) {
        this.id = id;
        this.userId = userId;
        this.date = date;
        this.minutesStudied = minutesStudied;
        this.sessionsCount = sessionsCount;
        this.contentsRead = contentsRead;
        this.annotationsCreated = annotationsCreated;
    }
}
exports.Activity = Activity;
//# sourceMappingURL=activity.entity.js.map