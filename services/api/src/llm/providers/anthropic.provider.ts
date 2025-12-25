import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Anthropic from "@anthropic-ai/sdk";
import {
  LLMProvider,
  LLMOptions,
  LLMResponse,
} from "./llm-provider.interface";
import { LLMConfigService } from "../llm-config.service";

/**
 * Anthropic Provider Implementation
 *
 * Handles interactions with Anthropic Claude API
 */
@Injectable()
export class AnthropicProvider implements LLMProvider {
  name = "anthropic";
  private readonly logger = new Logger(AnthropicProvider.name);
  private client: Anthropic | null = null;

  constructor(
    private config: ConfigService,
    private llmConfig: LLMConfigService,
  ) {
    const apiKey = this.config.get<string>("ANTHROPIC_API_KEY");

    if (apiKey) {
      this.client = new Anthropic({ apiKey });
      this.logger.log("Anthropic client initialized");
    } else {
      this.logger.warn(
        "ANTHROPIC_API_KEY not found, provider will be unavailable",
      );
    }
  }

  async isAvailable(): Promise<boolean> {
    return !!this.client;
  }

  async generateText(
    prompt: string,
    options?: LLMOptions,
  ): Promise<LLMResponse> {
    if (!this.client) {
      throw new Error("Anthropic client not initialized");
    }

    // Get model from DB config, fallback to options, then default
    const modelConfig = await this.llmConfig.getModelConfig(
      'anthropic',
      'claude-3-sonnet-20240229'
    );
    const model = options?.model || modelConfig.model;
    const temperature = options?.temperature ?? 0.7;
    const maxTokens = options?.maxTokens ?? 1024;

    this.logger.debug(`Generating text with model ${model}`);

    try {
      const response = await this.client.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const textContent = response.content.find((c) => c.type === "text");
      const text = textContent?.type === "text" ? textContent.text : "";

      return {
        text,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
        provider: this.name,
        model: response.model,
      };
    } catch (error) {
      this.logger.error(`Anthropic generation failed: ${error.message}`);
      throw error;
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // Anthropic doesn't provide embedding API
    // Return zeros or throw
    this.logger.warn("Anthropic does not support embeddings");
    throw new Error("Anthropic provider does not support embeddings");
  }
}
