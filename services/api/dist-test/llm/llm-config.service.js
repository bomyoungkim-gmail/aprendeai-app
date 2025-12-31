"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var LLMConfigService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMConfigService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const config_1 = require("@nestjs/config");
let LLMConfigService = LLMConfigService_1 = class LLMConfigService {
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
        this.logger = new common_1.Logger(LLMConfigService_1.name);
        this.cache = new Map();
        this.CACHE_TTL = 5 * 60 * 1000;
    }
    async getModelConfig(provider, defaultModel) {
        const cacheKey = `llm.${provider}.model`;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return {
                provider,
                model: cached.value,
                source: "database",
            };
        }
        try {
            const dbConfig = await this.prisma.app_configs.findFirst({
                where: {
                    key: cacheKey,
                    category: "llm",
                },
                orderBy: {
                    environment: "desc",
                },
            });
            if (dbConfig === null || dbConfig === void 0 ? void 0 : dbConfig.value) {
                this.logger.debug(`Using DB model for ${provider}: ${dbConfig.value}`);
                this.cache.set(cacheKey, {
                    value: dbConfig.value,
                    timestamp: Date.now(),
                });
                return {
                    provider,
                    model: dbConfig.value,
                    source: "database",
                };
            }
        }
        catch (error) {
            this.logger.error(`Failed to fetch LLM config from DB: ${error.message}`);
        }
        const envKey = `${provider.toUpperCase()}_MODEL`;
        const envModel = this.config.get(envKey);
        if (envModel) {
            this.logger.debug(`Using env model for ${provider}: ${envModel}`);
            return {
                provider,
                model: envModel,
                source: "env",
            };
        }
        this.logger.debug(`Using default model for ${provider}: ${defaultModel}`);
        return {
            provider,
            model: defaultModel,
            source: "default",
        };
    }
    async getModelName(provider, defaultModel = "gpt-4") {
        const config = await this.getModelConfig(provider, defaultModel);
        return config.model;
    }
    clearCache(provider) {
        if (provider) {
            this.cache.delete(`llm.${provider}.model`);
            this.logger.log(`Cache cleared for ${provider}`);
        }
        else {
            this.cache.clear();
            this.logger.log("All LLM config cache cleared");
        }
    }
    async preloadCache() {
        try {
            const configs = await this.prisma.app_configs.findMany({
                where: {
                    category: "llm",
                    key: {
                        endsWith: ".model",
                    },
                },
            });
            configs.forEach((config) => {
                this.cache.set(config.key, {
                    value: config.value,
                    timestamp: Date.now(),
                });
            });
            this.logger.log(`Preloaded ${configs.length} LLM configs into cache`);
        }
        catch (error) {
            this.logger.error(`Failed to preload cache: ${error.message}`);
        }
    }
};
exports.LLMConfigService = LLMConfigService;
exports.LLMConfigService = LLMConfigService = LLMConfigService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], LLMConfigService);
//# sourceMappingURL=llm-config.service.js.map