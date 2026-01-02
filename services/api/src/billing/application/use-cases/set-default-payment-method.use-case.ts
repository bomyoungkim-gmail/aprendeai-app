import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { IPaymentMethodRepository } from "../../domain/interfaces/payment-method.repository.interface";

@Injectable()
export class SetDefaultPaymentMethodUseCase {
  constructor(
    @Inject(IPaymentMethodRepository)
    private paymentMethodRepo: IPaymentMethodRepository,
  ) {}

  async execute(paymentMethodId: string): Promise<void> {
    const method = await this.paymentMethodRepo.findById(paymentMethodId);
    if (!method) throw new NotFoundException("Payment method not found");

    await this.paymentMethodRepo.setDefault(paymentMethodId);
  }
}
