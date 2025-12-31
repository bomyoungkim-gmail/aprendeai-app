import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  LLMProvider,
  LLMOptions,
  LLMResponse,
} from "./providers/llm-provider.interface";
import { OpenAIProvider } from "./providers/openai.provider";
import { GeminiProvider } from "./providers/gemini.provider";
import { AnthropicProvider } from "./providers/anthropic.provider";
import { DegradedModeProvider } from "./providers/degraded.provider";

/**
 * LLM Service - Orchestrator
 *
 * Manages multiple LLM providers with automatic fallback and retry logic
 */
@Injectable()
export class LLMService {
  private readonly logger = new Logger(LLMService.name);
  private providers: LLMProvider[];
  private maxRetries: number;
  private retryDelay: number;

  constructor(
    private config: ConfigService,
    private openaiProvider: OpenAIProvider,
    private geminiProvider: GeminiProvider,
    private anthropicProvider: AnthropicProvider,
    private degradedProvider: DegradedModeProvider,
  ) {
    // Order matters: try providers in sequence
    // Prioritize Gemini (free tier), then Anthropic (balanced), then OpenAI, then Fallback
    this.providers = [
      geminiProvider, // Try Gemini first (free tier available)
      anthropicProvider, // Claude Sonnet (balanced cost/quality)
      openaiProvider, // GPT fallback
      degradedProvider, // Always available fallback
    ];

    this.maxRetries = this.config.get("LLM_MAX_RETRIES", 3);
    this.retryDelay = this.config.get("LLM_RETRY_DELAY", 1000);

    this.logger.log(
      `LLM Service initialized with ${this.providers.length} providers`,
    );
  }

  /**
   * Generate text with automatic fallback
   * Tries providers in order until one succeeds
   */
  async generateText(
    prompt: string,
    options?: LLMOptions & { allowDegraded?: boolean },
  ): Promise<LLMResponse> {
    const allowDegraded = options?.allowDegraded ?? true;

    for (const provider of this.providers) {
      // Skip degraded mode if not allowed
      if (provider.name === "degraded" && !allowDegraded) {
        this.logger.debug("Skipping degraded mode (not allowed)");
        continue;
      }

      // Check availability
      const isAvailable = await provider.isAvailable();
      if (!isAvailable) {
        this.logger.warn(
          `Provider ${provider.name} is not available, trying next...`,
        );
        continue;
      }

      // Try with retries
      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        try {
          this.logger.debug(
            `Attempting to generate text with ${provider.name} (attempt ${attempt}/${this.maxRetries})`,
          );

          const response = await provider.generateText(prompt, options);

          this.logger.log(`Successfully generated text with ${provider.name}`);
          return response;
        } catch (error) {
          this.logger.error(
            `Attempt ${attempt} failed with ${provider.name}: ${error.message}`,
          );

          // Rate limit or quota exceeded - move to next provider immediately
          if (this.isRateLimitError(error)) {
            this.logger.warn(
              `Rate limit/quota exceeded for ${provider.name}, moving to fallback`,
            );
            break; // Skip to next provider
          }

          // Last attempt with this provider
          if (attempt === this.maxRetries) {
            this.logger.warn(
              `All ${this.maxRetries} attempts failed with ${provider.name}`,
            );
            break; // Move to next provider
          }

          // Wait before retry (exponential backoff)
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    // All providers failed
    throw new Error(
      "All LLM providers failed. AI features temporarily unavailable.",
    );
  }

  /**
   * Generate embedding with fallback
   */
  async generateEmbedding(text: string): Promise<number[]> {
    for (const provider of this.providers) {
      const isAvailable = await provider.isAvailable();
      if (!isAvailable) {
        continue;
      }

      try {
        return await provider.generateEmbedding(text);
      } catch (error) {
        this.logger.error(
          `Embedding failed with ${provider.name}: ${error.message}`,
        );
        continue;
      }
    }

    throw new Error("All LLM providers failed to generate embedding");
  }

  /**
   * Check if any AI provider is available (excluding degraded mode)
   */
  async isAIAvailable(): Promise<boolean> {
    for (const provider of this.providers) {
      if (provider.name !== "degraded" && (await provider.isAvailable())) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if error is a rate limit error
   */
  private isRateLimitError(error: any): boolean {
    return (
      error?.status === 429 ||
      error?.code === "insufficient_quota" ||
      error?.code === "rate_limit_exceeded" ||
      error?.message?.includes("rate limit") ||
      error?.message?.includes("quota")
    );
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
