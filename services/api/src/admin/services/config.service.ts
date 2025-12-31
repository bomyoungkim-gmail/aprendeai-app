import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { SecretService } from "./secret.service";
import { ConfigType, Environment } from "@prisma/client";
import { LLMConfigService } from "../../llm/llm-config.service";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class ConfigService {
  constructor(
    private prisma: PrismaService,
    private secretService: SecretService,
    private llmConfigService: LLMConfigService,
  ) {}

  /**
   * Get all configs with optional filters
   */
  async getConfigs(filters: { category?: string; environment?: Environment }) {
    const where: any = {};

    if (filters.category) where.category = filters.category;
    if (filters.environment) where.environment = filters.environment;

    const configs = await this.prisma.app_configs.findMany({
      where,
      orderBy: [{ category: "asc" }, { key: "asc" }],
    });

    // Mask secret refs for security
    return configs.map((c) => ({
      ...c,
      value: c.type === "SECRET_REF" ? "***MASKED***" : c.value,
    }));
  }

  /**
   * Get single config by ID
   */
  async getConfig(id: string, resolveSecrets = false) {
    const config = await this.prisma.app_configs.findUnique({
      where: { id },
    });

    if (!config) {
      throw new NotFoundException("Configuration not found");
    }

    // Resolve secret if requested (ADMIN only)
    if (resolveSecrets && config.type === "SECRET_REF") {
      try {
        const secret = await this.secretService.getSecret(config.value);
        return {
          ...config,
          resolvedValue: secret.value,
          secretName: secret.name,
        };
      } catch (error) {
        return {
          ...config,
          resolvedValue: null,
          error: "Secret not found or inaccessible",
        };
      }
    }

    return config;
  }

  /**
   * Get config by key
   */
  async getConfigByKey(key: string, environment?: Environment) {
    const where: any = { key };

    // If environment specified, find exact match or fallback to null (global)
    if (environment) {
      const configs = await this.prisma.app_configs.findMany({
        where: { key },
        orderBy: { environment: "desc" }, // Prefer env-specific over global
      });

      // Find env-specific first, then global
      const config =
        configs.find((c) => c.environment === environment) ||
        configs.find((c) => c.environment === null);

      return config || null;
    }

    return this.prisma.app_configs.findUnique({ where });
  }

  /**
   * Create new config
   */
  async createConfig(
    data: {
      key: string;
      value: string;
      type: ConfigType;
      category: string;
      environment?: Environment;
      description?: string;
      metadata?: any;
    },
    userId: string,
  ) {
    // Check for duplicate key + environment combo
    const existing = await this.prisma.app_configs.findFirst({
      where: {
        key: data.key,
        environment: data.environment || null,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Config with key "${data.key}" already exists for this environment`,
      );
    }

    return this.prisma.app_configs.create({
      data: {
        id: uuidv4(),
        updated_at: new Date(),
        ...data,
        created_by: userId,
        updated_by: userId,
      },
    });
  }

  /**
   * Update config
   */
  async updateConfig(
    id: string,
    data: {
      value?: string;
      description?: string;
      metadata?: any;
    },
    userId: string,
  ) {
    const config = await this.prisma.app_configs.findUnique({ where: { id } });

    if (!config) {
      throw new NotFoundException("Configuration not found");
    }

    return this.prisma.app_configs.update({
      where: { id },
      data: {
        ...data,
        updated_by: userId,
        updated_at: new Date(),
      },
    });
  }

  /**
   * Delete config
   */
  async deleteConfig(id: string) {
    const config = await this.prisma.app_configs.findUnique({ where: { id } });

    if (!config) {
      throw new NotFoundException("Configuration not found");
    }

    return this.prisma.app_configs.delete({ where: { id } });
  }

  /**
   * Validate provider configuration
   */
  async validateProvider(provider: string, config: any) {
    switch (provider.toLowerCase()) {
      case "openai":
        return this.validateOpenAI(config);
      case "kci":
        return this.validateKCI(config);
      case "aws":
        return this.validateAWS(config);
      default:
        throw new BadRequestException(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Validate OpenAI configuration
   */
  private async validateOpenAI(config: { apiKey: string; model?: string }) {
    if (!config.apiKey) {
      throw new BadRequestException("API key is required");
    }

    // Basic format validation
    if (!config.apiKey.startsWith("sk-")) {
      throw new BadRequestException("Invalid OpenAI API key format");
    }

    // Optional: Validate model if provided
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

  /**
   * Validate KCI configuration
   */
  private async validateKCI(config: { apiKey: string; endpoint: string }) {
    if (!config.apiKey || !config.endpoint) {
      throw new BadRequestException("API key and endpoint are required");
    }

    // Validate endpoint format
    try {
      new URL(config.endpoint);
    } catch (error) {
      throw new BadRequestException("Invalid endpoint URL format");
    }

    return {
      valid: true,
      message: "KCI configuration is valid",
    };
  }

  /**
   * Validate AWS configuration
   */
  private async validateAWS(config: {
    accessKeyId: string;
    secretAccessKey: string;
    region?: string;
  }) {
    if (!config.accessKeyId || !config.secretAccessKey) {
      throw new BadRequestException(
        "Access key ID and secret access key are required",
      );
    }

    // Basic format validation
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

  /**
   * Get configs by category
   */
  async getConfigsByCategory(category: string, environment?: Environment) {
    const where: any = { category };
    if (environment) where.environment = environment;

    return this.prisma.app_configs.findMany({
      where,
      orderBy: { key: "asc" },
    });
  }

  /**
   * Clear LLM config cache
   */
  async clearLLMCache(provider?: string): Promise<void> {
    this.llmConfigService.clearCache(provider);
  }
}
