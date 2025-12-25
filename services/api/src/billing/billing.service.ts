import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all active plans
   */
  async getPlans() {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { monthlyPrice: "asc" }, // FREE first
    });
  }

  /**
   * Get plan by code
   */
  async getPlanByCode(code: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { code },
    });

    if (!plan) {
      throw new NotFoundException(`Plan ${code} not found`);
    }

    return plan;
  }

  /**
   * Get plan by ID
   */
  async getPlanById(id: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
    });

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
    return this.prisma.plan.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        entitlements: data.entitlements,
        monthlyPrice: data.monthlyPrice,
        yearlyPrice: data.yearlyPrice,
        isActive: true,
      },
    });
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
    const plan = await this.getPlanById(id);

    return this.prisma.plan.update({
      where: { id: plan.id },
      data,
    });
  }

  /**
   * Soft delete plan
   */
  async deletePlan(id: string) {
    return this.updatePlan(id, { isActive: false });
  }
}
