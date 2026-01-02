import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { IInvoiceRepository } from "../../domain/interfaces/invoice.repository.interface";
import { Invoice } from "../../domain/entities/invoice.entity";

@Injectable()
export class PrismaInvoiceRepository implements IInvoiceRepository {
  constructor(private prisma: PrismaService) {}

  async create(invoice: Invoice): Promise<Invoice> {
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
        metadata: invoice.metadata as any,
        updated_at: new Date(),
      },
    });

    return this.mapToEntity(created);
  }

  async findById(id: string): Promise<Invoice | null> {
    const invoice = await this.prisma.invoices.findUnique({
      where: { id },
    });

    if (!invoice) return null;
    return this.mapToEntity(invoice);
  }

  async findBySubscription(subscriptionId: string): Promise<Invoice[]> {
    const invoices = await this.prisma.invoices.findMany({
      where: { subscription_id: subscriptionId },
      orderBy: { created_at: "desc" },
    });

    return invoices.map((i) => this.mapToEntity(i));
  }

  async update(id: string, data: Partial<Invoice>): Promise<Invoice> {
    const updated = await this.prisma.invoices.update({
      where: { id },
      data: {
        status: data.status,
        metadata: data.metadata as any,
        updated_at: new Date(),
      },
    });

    return this.mapToEntity(updated);
  }

  private mapToEntity(model: any): Invoice {
    return new Invoice(
      model.id,
      model.subscription_id,
      model.amount,
      model.currency,
      model.period_start,
      model.period_end,
      model.status as any,
      model.provider_invoice_id || "",
      model.metadata as Record<string, any>,
    );
  }
}
