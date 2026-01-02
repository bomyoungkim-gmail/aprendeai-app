import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { IPaymentMethodRepository } from "../../domain/interfaces/payment-method.repository.interface";
import { PaymentMethod } from "../../domain/entities/payment-method.entity";

@Injectable()
export class PrismaPaymentMethodRepository implements IPaymentMethodRepository {
  constructor(private prisma: PrismaService) {}

  async create(method: PaymentMethod): Promise<PaymentMethod> {
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
        metadata: method.metadata as any,
        updated_at: new Date(),
      },
    });

    return this.mapToEntity(created);
  }

  async findById(id: string): Promise<PaymentMethod | null> {
    const method = await this.prisma.payment_methods.findUnique({
      where: { id },
    });

    if (!method) return null;
    return this.mapToEntity(method);
  }

  async findByUser(userId: string): Promise<PaymentMethod[]> {
    const methods = await this.prisma.payment_methods.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
    });

    return methods.map((m) => this.mapToEntity(m));
  }

  async setDefault(id: string): Promise<PaymentMethod> {
    // Find the current default and unset it
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

  async delete(id: string): Promise<void> {
    await this.prisma.payment_methods.delete({
      where: { id },
    });
  }

  private mapToEntity(model: any): PaymentMethod {
    return new PaymentMethod(
      model.id,
      model.user_id,
      model.provider,
      model.last4,
      model.exp_month,
      model.exp_year,
      model.is_default,
      model.encrypted_details,
      model.metadata as Record<string, any>,
    );
  }
}
