import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>("STRIPE_SECRET_KEY");
    if (!secretKey) {
      this.logger.warn(
        "STRIPE_SECRET_KEY not found in environment. Stripe operations will fail.",
      );
      return;
    }
    this.stripe = new Stripe(secretKey, {
      apiVersion: "2023-10-16" as any,
    });
  }

  async createSubscription(customerId: string, priceId: string) {
    return this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
    });
  }

  async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = true, // YouTube-style default
  ) {
    if (cancelAtPeriodEnd) {
      // Keep access until period ends
      return this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    } else {
      // Immediate cancellation
      return this.stripe.subscriptions.cancel(subscriptionId);
    }
  }

  async updateSubscription(
    subscriptionId: string,
    newPriceId: string,
    prorationBehavior: "always_invoice" | "none" = "always_invoice",
  ) {
    return this.stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: (await this.stripe.subscriptions.retrieve(subscriptionId)).items
            .data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: prorationBehavior,
    });
  }

  async createInvoice(subscriptionId: string) {
    // This is a simplified version, usually Stripe creates invoices automatically
    return this.stripe.invoices.create({
      subscription: subscriptionId,
    });
  }

  async attachPaymentMethod(customerId: string, paymentMethodId: string) {
    await this.stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    return this.stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
  }

  async createCustomer(email: string, name?: string) {
    return this.stripe.customers.create({
      email,
      name,
    });
  }

  async getSubscription(id: string) {
    return this.stripe.subscriptions.retrieve(id);
  }
}
