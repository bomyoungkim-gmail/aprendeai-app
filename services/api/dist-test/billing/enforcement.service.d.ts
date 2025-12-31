import { HttpException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ScopeType, Environment } from "@prisma/client";
import { EntitlementsService } from "./entitlements.service";
export declare class LimitExceededException extends HttpException {
    constructor(data: {
        metric: string;
        limit: number;
        current: number;
        upgradeHint?: boolean;
    });
}
export declare class FeatureDisabledException extends HttpException {
    constructor(feature: string);
}
export declare class EnforcementService {
    private prisma;
    private entitlementsService;
    constructor(prisma: PrismaService, entitlementsService: EntitlementsService);
    requireFeature(scopeType: ScopeType, scopeId: string, featureKey: string, environment: Environment): Promise<boolean>;
    enforceLimit(scopeType: ScopeType, scopeId: string, metric: string, quantity: number, environment: Environment): Promise<boolean>;
    private getCurrentUsage;
    wouldExceedLimit(scopeType: ScopeType, scopeId: string, metric: string, quantity: number, environment: Environment): Promise<{
        exceeded: boolean;
        current: number;
        limit: number;
    }>;
    enforceHierarchy(hierarchy: {
        scopeType: ScopeType;
        scopeId: string;
    }[], metric: string, quantity: number, environment: Environment): Promise<{
        scopeType: ScopeType;
        scopeId: string;
    }>;
    requireFeatureHierarchy(hierarchy: {
        scopeType: ScopeType;
        scopeId: string;
    }[], featureKey: string, environment: Environment): Promise<{
        scopeType: ScopeType;
        scopeId: string;
    }>;
}
