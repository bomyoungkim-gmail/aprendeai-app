"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Invoice = void 0;
class Invoice {
    constructor(id, subscriptionId, amount, currency, periodStart, periodEnd, status, stripeInvoiceId, metadata) {
        this.id = id;
        this.subscriptionId = subscriptionId;
        this.amount = amount;
        this.currency = currency;
        this.periodStart = periodStart;
        this.periodEnd = periodEnd;
        this.status = status;
        this.stripeInvoiceId = stripeInvoiceId;
        this.metadata = metadata;
    }
}
exports.Invoice = Invoice;
//# sourceMappingURL=invoice.entity.js.map