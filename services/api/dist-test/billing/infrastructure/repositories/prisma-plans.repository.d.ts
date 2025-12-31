import { PrismaService } from "../../../prisma/prisma.service";
import { IPlansRepository } from "../../domain/interfaces/plans.repository.interface";
import { Plan } from "../../domain/entities/plan.entity";
export declare class PrismaPlansRepository implements IPlansRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(plan: Plan): Promise<Plan>;
    findById(id: string): Promise<Plan | null>;
    findByCode(code: string): Promise<Plan | null>;
    findActive(): Promise<Plan[]>;
    update(id: string, updates: Partial<Plan>): Promise<Plan>;
    private mapToDomain;
}
