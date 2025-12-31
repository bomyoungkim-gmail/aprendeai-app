import { CanActivate, ExecutionContext } from "@nestjs/common";
export declare class InstitutionGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean;
}
