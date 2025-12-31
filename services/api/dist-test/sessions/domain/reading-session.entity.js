"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionOutcome = exports.SessionEvent = exports.ReadingSession = void 0;
class ReadingSession {
    constructor(partial) {
        Object.assign(this, partial);
    }
    isFinished() {
        return this.phase === 'FINISHED';
    }
}
exports.ReadingSession = ReadingSession;
class SessionEvent {
}
exports.SessionEvent = SessionEvent;
class SessionOutcome {
}
exports.SessionOutcome = SessionOutcome;
//# sourceMappingURL=reading-session.entity.js.map