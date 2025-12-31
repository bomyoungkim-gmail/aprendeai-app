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
exports.PrismaInvoiceRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const invoice_entity_1 = require("../../domain/entities/invoice.entity");
let PrismaInvoiceRepository = class PrismaInvoiceRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(invoice) {
        const created = await this.prisma.invoices.create({
            data: {
                id: invoice.id,
                subscription_id: invoice.subscriptionId,
                amount: invoice.amount,
                currency: invoice.currency,
                period_start: invoice.periodStart,
                period_end: invoice.periodEnd,
                status: invoice.status,
                provider_invoice_id: invoice.stripeInvoiceId,
                metadata: invoice.metadata,
                updated_at: new Date(),
            },
        });
        return this.mapToEntity(created);
    }
    async findById(id) {
        const invoice = await this.prisma.invoices.findUnique({
            where: { id },
        });
        if (!invoice)
            return null;
        return this.mapToEntity(invoice);
    }
    async findBySubscription(subscriptionId) {
        const invoices = await this.prisma.invoices.findMany({
            where: { subscription_id: subscriptionId },
            orderBy: { created_at: 'desc' },
        });
        return invoices.map((i) => this.mapToEntity(i));
    }
    async update(id, data) {
        const updated = await this.prisma.invoices.update({
            where: { id },
            data: {
                status: data.status,
                metadata: data.metadata,
                updated_at: new Date(),
            },
        });
        return this.mapToEntity(updated);
    }
    mapToEntity(model) {
        return new invoice_entity_1.Invoice(model.id, model.subscription_id, model.amount, model.currency, model.period_start, model.period_end, model.status, model.provider_invoice_id || '', model.metadata);
    }
};
exports.PrismaInvoiceRepository = PrismaInvoiceRepository;
exports.PrismaInvoiceRepository = PrismaInvoiceRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaInvoiceRepository);
//# sourceMappingURL=prisma-invoice.repository.js.map