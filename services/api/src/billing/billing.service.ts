import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { CreateSubscriptionUseCase } from "./application/use-cases/create-subscription.use-case";
import { CancelSubscriptionUseCase } from "./application/use-cases/cancel-subscription.use-case";
import { AddPaymentMethodUseCase } from "./application/use-cases/add-payment-method.use-case";
import { SetDefaultPaymentMethodUseCase } from "./application/use-cases/set-default-payment-method.use-case";
import { GenerateInvoiceUseCase } from "./application/use-cases/generate-invoice.use-case";
import { IPlansRepository } from "./domain/interfaces/plans.repository.interface";
import { Plan } from "./domain/entities/plan.entity";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class BillingService {
  constructor(
    @Inject(IPlansRepository)
    private readonly plansRepository: IPlansRepository,
    private createSubscriptionUseCase: CreateSubscriptionUseCase,
    private cancelSubscriptionUseCase: CancelSubscriptionUseCase,
    private addPaymentMethodUseCase: AddPaymentMethodUseCase,
    private setDefaultPaymentMethodUseCase: SetDefaultPaymentMethodUseCase,
    private generateInvoiceUseCase: GenerateInvoiceUseCase,
  ) {}

  // --- Subscriptions ---
  async createSubscription(
    userId: string,
    planId: string,
    stripePriceId: string,
  ) {
    return this.createSubscriptionUseCase.execute(
      userId,
      planId,
      stripePriceId,
    );
  }

  async cancelSubscription(subscriptionId: string) {
    return this.cancelSubscriptionUseCase.execute(subscriptionId);
  }

  // --- Invoices ---
  async generateInvoice(subscriptionId: string) {
    return this.generateInvoiceUseCase.execute(subscriptionId);
  }

  // --- Payment Methods ---
  async addPaymentMethod(userId: string, stripePaymentMethodId: string) {
    return this.addPaymentMethodUseCase.execute(userId, stripePaymentMethodId);
  }

  async setDefaultPaymentMethod(paymentMethodId: string) {
    return this.setDefaultPaymentMethodUseCase.execute(paymentMethodId);
  }

  // --- Plans ---
  /**
   * Get all active plans
   */
  async getPlans() {
    return this.plansRepository.findActive();
  }

  /**
   * Get plan by code
   */
  async getPlanByCode(code: string) {
    const plan = await this.plansRepository.findByCode(code);

    if (!plan) {
      throw new NotFoundException(`Plan ${code} not found`);
    }

    return plan;
  }

  /**
   * Get plan by ID
   */
  async getPlanById(id: string) {
    const plan = await this.plansRepository.findById(id);

    if (!plan) {
      throw new NotFoundException("Plan not found");
    }

    return plan;
  }

  /**
   * Create plan (Admin only)
   */
  async createPlan(data: {
    code: string;
    name: string;
    description?: string;
    entitlements: any;
    monthlyPrice?: number;
    yearlyPrice?: number;
  }) {
    const plan = new Plan({
      id: uuidv4(),
      code: data.code,
      name: data.name,
      description: data.description,
      entitlements: data.entitlements,
      monthlyPrice: data.monthlyPrice,
      yearlyPrice: data.yearlyPrice,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return this.plansRepository.create(plan);
  }

  /**
   * Update plan (Admin only)
   */
  async updatePlan(
    id: string,
    data: {
      name?: string;
      description?: string;
      entitlements?: any;
      monthlyPrice?: number;
      yearlyPrice?: number;
      isActive?: boolean;
    },
  ) {
    await this.getPlanById(id); // Ensure exists

    return this.plansRepository.update(id, {
      name: data.name,
      description: data.description,
      entitlements: data.entitlements,
      monthlyPrice: data.monthlyPrice,
      yearlyPrice: data.yearlyPrice,
      isActive: data.isActive,
    });
  }

  /**
   * Soft delete plan
   */
  async deletePlan(id: string) {
    return this.updatePlan(id, { isActive: false });
  }
}
