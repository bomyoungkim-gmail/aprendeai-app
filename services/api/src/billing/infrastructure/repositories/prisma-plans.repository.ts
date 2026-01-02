import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { IPlansRepository } from "../../domain/interfaces/plans.repository.interface";
import { Plan } from "../../domain/entities/plan.entity";

@Injectable()
export class PrismaPlansRepository implements IPlansRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(plan: Plan): Promise<Plan> {
    const created = await this.prisma.plans.create({
      data: {
        id: plan.id,
        code: plan.code,
        name: plan.name,
        description: plan.description,
        entitlements: plan.entitlements,
        monthly_price: plan.monthlyPrice,
        yearly_price: plan.yearlyPrice,
        is_active: plan.isActive,
        updated_at: new Date(),
      },
    });
    return this.mapToDomain(created);
  }

  async findById(id: string): Promise<Plan | null> {
    const found = await this.prisma.plans.findUnique({
      where: { id },
    });
    return found ? this.mapToDomain(found) : null;
  }

  async findByCode(code: string): Promise<Plan | null> {
    const found = await this.prisma.plans.findUnique({
      where: { code },
    });
    return found ? this.mapToDomain(found) : null;
  }

  async findActive(): Promise<Plan[]> {
    const found = await this.prisma.plans.findMany({
      where: { is_active: true },
      orderBy: { monthly_price: "asc" },
    });
    return found.map(this.mapToDomain);
  }

  async update(id: string, updates: Partial<Plan>): Promise<Plan> {
    // Logic from BillingService: "isActive" update maps to "is_active", etc.
    // But update takes Partial<Plan>.
    const data: any = {};
    if (updates.name !== undefined) data.name = updates.name;
    if (updates.description !== undefined)
      data.description = updates.description;
    if (updates.entitlements !== undefined)
      data.entitlements = updates.entitlements;
    if (updates.monthlyPrice !== undefined)
      data.monthly_price = updates.monthlyPrice;
    if (updates.yearlyPrice !== undefined)
      data.yearly_price = updates.yearlyPrice;
    if (updates.isActive !== undefined) data.is_active = updates.isActive;
    data.updated_at = new Date();

    const updated = await this.prisma.plans.update({
      where: { id },
      data,
    });
    return this.mapToDomain(updated);
  }

  private mapToDomain(item: any): Plan {
    return new Plan({
      id: item.id,
      code: item.code,
      name: item.name,
      description: item.description,
      entitlements: item.entitlements,
      monthlyPrice:
        item.monthly_price !== null ? Number(item.monthly_price) : undefined,
      yearlyPrice:
        item.yearly_price !== null ? Number(item.yearly_price) : undefined,
      isActive: item.is_active,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    });
  }
}
