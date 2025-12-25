import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

interface LLMModelConfig {
  provider: string;
  model: string;
  source: 'database' | 'env' | 'default';
}

@Injectable()
export class LLMConfigService {
  private readonly logger = new Logger(LLMConfigService.name);
  private cache: Map<string, { value: string; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  /**
   * Get LLM model configuration for a provider
   * Priority: Database > Environment Variable > Provider Default
   */
  async getModelConfig(provider: string, defaultModel: string): Promise<LLMModelConfig> {
    const cacheKey = `llm.${provider}.model`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return {
        provider,
        model: cached.value,
        source: 'database',
      };
    }

    try {
      // Try to get from database
      const dbConfig = await this.prisma.appConfig.findFirst({
        where: {
          key: cacheKey,
          category: 'llm',
        },
        orderBy: {
          environment: 'desc', // Prefer env-specific over global
        },
      });

      if (dbConfig?.value) {
        this.logger.debug(`Using DB model for ${provider}: ${dbConfig.value}`);
        
        // Update cache
        this.cache.set(cacheKey, {
          value: dbConfig.value,
          timestamp: Date.now(),
        });

        return {
          provider,
          model: dbConfig.value,
          source: 'database',
        };
      }
    } catch (error) {
      this.logger.error(`Failed to fetch LLM config from DB: ${error.message}`);
    }

    // Fallback to environment variable
    const envKey = `${provider.toUpperCase()}_MODEL`;
    const envModel = this.config.get<string>(envKey);
    
    if (envModel) {
      this.logger.debug(`Using env model for ${provider}: ${envModel}`);
      return {
        provider,
        model: envModel,
        source: 'env',
      };
    }

    // Final fallback to default
    this.logger.debug(`Using default model for ${provider}: ${defaultModel}`);
    return {
      provider,
      model: defaultModel,
      source: 'default',
    };
  }

  /**
   * Convenience method to get just the model name string
   */
  async getModelName(provider: string, defaultModel: string = 'gpt-4'): Promise<string> {
    const config = await this.getModelConfig(provider, defaultModel);
    return config.model;
  }

  /**
   * Clear cache for a specific provider or all
   */
  clearCache(provider?: string): void {
    if (provider) {
      this.cache.delete(`llm.${provider}.model`);
      this.logger.log(`Cache cleared for ${provider}`);
    } else {
      this.cache.clear();
      this.logger.log('All LLM config cache cleared');
    }
  }

  /**
   * Preload configs into cache (useful on startup)
   */
  async preloadCache(): Promise<void> {
    try {
      const configs = await this.prisma.appConfig.findMany({
        where: {
          category: 'llm',
          key: {
            endsWith: '.model',
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
    } catch (error) {
      this.logger.error(`Failed to preload cache: ${error.message}`);
    }
  }
}
