import { PrismaService } from "../prisma/prisma.service";
export type ScopeType = "GLOBAL" | "USER" | "INSTITUTION" | "FAMILY";
export declare class FeatureFlagsService {
    private prisma;
    constructor(prisma: PrismaService);
    isEnabled(flagKey: string, userId?: string, institutionId?: string): Promise<boolean>;
    isEnabledSync(flagKey: string, defaultValue?: boolean): boolean;
    getEnabledFlags(userId?: string, institutionId?: string): Promise<string[]>;
    enableFlag(flagKey: string, scopeType?: ScopeType, scopeId?: string): Promise<void>;
    disableFlag(flagKey: string, scopeType?: ScopeType, scopeId?: string): Promise<void>;
}
