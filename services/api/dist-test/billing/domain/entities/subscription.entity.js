"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subscription = void 0;
class Subscription {
    constructor(id, userId, scopeType, scopeId, planId, status, startDate, stripeSubscriptionId, endDate, metadata, plan) {
        this.id = id;
        this.userId = userId;
        this.scopeType = scopeType;
        this.scopeId = scopeId;
        this.planId = planId;
        this.status = status;
        this.startDate = startDate;
        this.stripeSubscriptionId = stripeSubscriptionId;
        this.endDate = endDate;
        this.metadata = metadata;
        this.plan = plan;
    }
}
exports.Subscription = Subscription;
//# sourceMappingURL=subscription.entity.js.map