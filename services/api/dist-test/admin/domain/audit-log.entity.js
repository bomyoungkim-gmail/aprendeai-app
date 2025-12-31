"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLog = void 0;
class AuditLog {
    constructor(partial) {
        Object.assign(this, partial);
        this.createdAt = partial.createdAt || new Date();
    }
}
exports.AuditLog = AuditLog;
//# sourceMappingURL=audit-log.entity.js.map