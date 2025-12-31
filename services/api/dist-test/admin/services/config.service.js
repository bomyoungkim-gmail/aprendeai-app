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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const secret_service_1 = require("./secret.service");
const llm_config_service_1 = require("../../llm/llm-config.service");
const uuid_1 = require("uuid");
let ConfigService = class ConfigService {
    constructor(prisma, secretService, llmConfigService) {
        this.prisma = prisma;
        this.secretService = secretService;
        this.llmConfigService = llmConfigService;
    }
    async getConfigs(filters) {
        const where = {};
        if (filters.category)
            where.category = filters.category;
        if (filters.environment)
            where.environment = filters.environment;
        const configs = await this.prisma.app_configs.findMany({
            where,
            orderBy: [{ category: "asc" }, { key: "asc" }],
        });
        return configs.map((c) => (Object.assign(Object.assign({}, c), { value: c.type === "SECRET_REF" ? "***MASKED***" : c.value })));
    }
    async getConfig(id, resolveSecrets = false) {
        const config = await this.prisma.app_configs.findUnique({
            where: { id },
        });
        if (!config) {
            throw new common_1.NotFoundException("Configuration not found");
        }
        if (resolveSecrets && config.type === "SECRET_REF") {
            try {
                const secret = await this.secretService.getSecret(config.value);
                return Object.assign(Object.assign({}, config), { resolvedValue: secret.value, secretName: secret.name });
            }
            catch (error) {
                return Object.assign(Object.assign({}, config), { resolvedValue: null, error: "Secret not found or inaccessible" });
            }
        }
        return config;
    }
    async getConfigByKey(key, environment) {
        const where = { key };
        if (environment) {
            const configs = await this.prisma.app_configs.findMany({
                where: { key },
                orderBy: { environment: "desc" },
            });
            const config = configs.find((c) => c.environment === environment) ||
                configs.find((c) => c.environment === null);
            return config || null;
        }
        return this.prisma.app_configs.findUnique({ where });
    }
    async createConfig(data, userId) {
        const existing = await this.prisma.app_configs.findFirst({
            where: {
                key: data.key,
                environment: data.environment || null,
            },
        });
        if (existing) {
            throw new common_1.BadRequestException(`Config with key "${data.key}" already exists for this environment`);
        }
        return this.prisma.app_configs.create({
            data: Object.assign(Object.assign({ id: (0, uuid_1.v4)(), updated_at: new Date() }, data), { created_by: userId, updated_by: userId }),
        });
    }
    async updateConfig(id, data, userId) {
        const config = await this.prisma.app_configs.findUnique({ where: { id } });
        if (!config) {
            throw new common_1.NotFoundException("Configuration not found");
        }
        return this.prisma.app_configs.update({
            where: { id },
            data: Object.assign(Object.assign({}, data), { updated_by: userId, updated_at: new Date() }),
        });
    }
    async deleteConfig(id) {
        const config = await this.prisma.app_configs.findUnique({ where: { id } });
        if (!config) {
            throw new common_1.NotFoundException("Configuration not found");
        }
        return this.prisma.app_configs.delete({ where: { id } });
    }
    async validateProvider(provider, config) {
        switch (provider.toLowerCase()) {
            case "openai":
                return this.validateOpenAI(config);
            case "kci":
                return this.validateKCI(config);
            case "aws":
                return this.validateAWS(config);
            default:
                throw new common_1.BadRequestException(`Unknown provider: ${provider}`);
        }
    }
    async validateOpenAI(config) {
        if (!config.apiKey) {
            throw new common_1.BadRequestException("API key is required");
        }
        if (!config.apiKey.startsWith("sk-")) {
            throw new common_1.BadRequestException("Invalid OpenAI API key format");
        }
        if (config.model) {
            const validModels = ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"];
            if (!validModels.includes(config.model)) {
                return {
                    valid: true,
                    warning: `Model ${config.model} may not be valid`,
                };
            }
        }
        return {
            valid: true,
            message: "OpenAI configuration is valid",
        };
    }
    async validateKCI(config) {
        if (!config.apiKey || !config.endpoint) {
            throw new common_1.BadRequestException("API key and endpoint are required");
        }
        try {
            new URL(config.endpoint);
        }
        catch (error) {
            throw new common_1.BadRequestException("Invalid endpoint URL format");
        }
        return {
            valid: true,
            message: "KCI configuration is valid",
        };
    }
    async validateAWS(config) {
        if (!config.accessKeyId || !config.secretAccessKey) {
            throw new common_1.BadRequestException("Access key ID and secret access key are required");
        }
        if (!config.accessKeyId.startsWith("AKIA")) {
            return {
                valid: true,
                warning: "Access key ID format may be invalid",
            };
        }
        return {
            valid: true,
            message: "AWS configuration is valid",
        };
    }
    async getConfigsByCategory(category, environment) {
        const where = { category };
        if (environment)
            where.environment = environment;
        return this.prisma.app_configs.findMany({
            where,
            orderBy: { key: "asc" },
        });
    }
    async clearLLMCache(provider) {
        this.llmConfigService.clearCache(provider);
    }
};
exports.ConfigService = ConfigService;
exports.ConfigService = ConfigService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        secret_service_1.SecretService,
        llm_config_service_1.LLMConfigService])
], ConfigService);
//# sourceMappingURL=config.service.js.map