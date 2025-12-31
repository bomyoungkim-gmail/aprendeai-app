"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PendingApproval = void 0;
class PendingApproval {
    constructor(partial) {
        Object.assign(this, partial);
        this.createdAt = partial.createdAt || new Date();
    }
}
exports.PendingApproval = PendingApproval;
//# sourceMappingURL=pending-approval.entity.js.map