import { CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PlanLimitsService } from "../../billing/plan-limits.service";
export declare class QuotaGuard implements CanActivate {
    private planLimits;
    private reflector;
    constructor(planLimits: PlanLimitsService, reflector: Reflector);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
