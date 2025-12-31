import { PrismaService } from "../prisma/prisma.service";
import { ConfigService } from "@nestjs/config";
interface LLMModelConfig {
    provider: string;
    model: string;
    source: "database" | "env" | "default";
}
export declare class LLMConfigService {
    private prisma;
    private config;
    private readonly logger;
    private cache;
    private readonly CACHE_TTL;
    constructor(prisma: PrismaService, config: ConfigService);
    getModelConfig(provider: string, defaultModel: string): Promise<LLMModelConfig>;
    getModelName(provider: string, defaultModel?: string): Promise<string>;
    clearCache(provider?: string): void;
    preloadCache(): Promise<void>;
}
export {};
