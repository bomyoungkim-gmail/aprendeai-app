"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentMethod = void 0;
class PaymentMethod {
    constructor(id, userId, provider, last4, expMonth, expYear, isDefault, encryptedDetails, metadata) {
        this.id = id;
        this.userId = userId;
        this.provider = provider;
        this.last4 = last4;
        this.expMonth = expMonth;
        this.expYear = expYear;
        this.isDefault = isDefault;
        this.encryptedDetails = encryptedDetails;
        this.metadata = metadata;
    }
}
exports.PaymentMethod = PaymentMethod;
//# sourceMappingURL=payment-method.entity.js.map