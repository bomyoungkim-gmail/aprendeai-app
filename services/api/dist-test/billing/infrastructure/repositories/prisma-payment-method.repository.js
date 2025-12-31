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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaPaymentMethodRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const payment_method_entity_1 = require("../../domain/entities/payment-method.entity");
let PrismaPaymentMethodRepository = class PrismaPaymentMethodRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(method) {
        const created = await this.prisma.payment_methods.create({
            data: {
                id: method.id,
                user_id: method.userId,
                provider: method.provider,
                last4: method.last4,
                exp_month: method.expMonth,
                exp_year: method.expYear,
                is_default: method.isDefault,
                encrypted_details: method.encryptedDetails,
                metadata: method.metadata,
                updated_at: new Date(),
            },
        });
        return this.mapToEntity(created);
    }
    async findById(id) {
        const method = await this.prisma.payment_methods.findUnique({
            where: { id },
        });
        if (!method)
            return null;
        return this.mapToEntity(method);
    }
    async findByUser(userId) {
        const methods = await this.prisma.payment_methods.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
        });
        return methods.map((m) => this.mapToEntity(m));
    }
    async setDefault(id) {
        const method = await this.findById(id);
        if (method) {
            await this.prisma.payment_methods.updateMany({
                where: { user_id: method.userId, is_default: true },
                data: { is_default: false },
            });
        }
        const updated = await this.prisma.payment_methods.update({
            where: { id },
            data: { is_default: true, updated_at: new Date() },
        });
        return this.mapToEntity(updated);
    }
    async delete(id) {
        await this.prisma.payment_methods.delete({
            where: { id },
        });
    }
    mapToEntity(model) {
        return new payment_method_entity_1.PaymentMethod(model.id, model.user_id, model.provider, model.last4, model.exp_month, model.exp_year, model.is_default, model.encrypted_details, model.metadata);
    }
};
exports.PrismaPaymentMethodRepository = PrismaPaymentMethodRepository;
exports.PrismaPaymentMethodRepository = PrismaPaymentMethodRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaPaymentMethodRepository);
//# sourceMappingURL=prisma-payment-method.repository.js.map