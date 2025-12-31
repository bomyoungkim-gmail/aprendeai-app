"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetDefaultPaymentMethodUseCase = void 0;
const common_1 = require("@nestjs/common");
const payment_method_repository_interface_1 = require("../../domain/interfaces/payment-method.repository.interface");
let SetDefaultPaymentMethodUseCase = class SetDefaultPaymentMethodUseCase {
    constructor(paymentMethodRepo) {
        this.paymentMethodRepo = paymentMethodRepo;
    }
    async execute(paymentMethodId) {
        const method = await this.paymentMethodRepo.findById(paymentMethodId);
        if (!method)
            throw new common_1.NotFoundException('Payment method not found');
        await this.paymentMethodRepo.setDefault(paymentMethodId);
    }
};
exports.SetDefaultPaymentMethodUseCase = SetDefaultPaymentMethodUseCase;
exports.SetDefaultPaymentMethodUseCase = SetDefaultPaymentMethodUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(payment_method_repository_interface_1.IPaymentMethodRepository)),
    __metadata("design:paramtypes", [Object])
], SetDefaultPaymentMethodUseCase);
//# sourceMappingURL=set-default-payment-method.use-case.js.map