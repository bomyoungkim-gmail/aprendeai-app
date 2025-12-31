import { Plan } from "../entities/plan.entity";
export interface IPlansRepository {
    create(plan: Plan): Promise<Plan>;
    findById(id: string): Promise<Plan | null>;
    findByCode(code: string): Promise<Plan | null>;
    findActive(): Promise<Plan[]>;
    update(id: string, updates: Partial<Plan>): Promise<Plan>;
}
export declare const IPlansRepository: unique symbol;
