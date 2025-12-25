import { Injectable, Logger } from "@nestjs/common";
import { LLMProvider, LLMOptions, LLMResponse } from "./llm-provider.interface";

/**
 * Degraded Mode Provider
 *
 * Fallback provider when all AI services are unavailable
 * Returns helpful error messages instead of AI-generated content
 */
@Injectable()
export class DegradedModeProvider implements LLMProvider {
  name = "degraded";
  private readonly logger = new Logger(DegradedModeProvider.name);

  async isAvailable(): Promise<boolean> {
    // Always available as last resort
    return true;
  }

  async generateText(
    prompt: string,
    options?: LLMOptions,
  ): Promise<LLMResponse> {
    this.logger.warn("Using degraded mode - AI service unavailable");

    return {
      text: "AI service is temporarily unavailable. Please try again later or contact support if the issue persists.",
      provider: this.name,
      model: "none",
    };
  }

  async generateEmbedding(text: string): Promise<number[]> {
    this.logger.warn(
      "Using degraded mode for embeddings - returning zero vector",
    );

    // Return zero vector of standard dimension (1536 for OpenAI ada-002)
    return new Array(1536).fill(0);
  }
}
