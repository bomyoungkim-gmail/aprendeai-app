import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";
import { LLMProvider, LLMOptions, LLMResponse } from "./llm-provider.interface";
import { LLMConfigService } from "../llm-config.service";

/**
 * OpenAI Provider Implementation
 *
 * Handles interactions with OpenAI API
 */
@Injectable()
export class OpenAIProvider implements LLMProvider {
  name = "openai";
  private readonly logger = new Logger(OpenAIProvider.name);
  private client: OpenAI | null = null;

  constructor(
    private config: ConfigService,
    private llmConfig: LLMConfigService,
  ) {
    const apiKey = this.config.get<string>("OPENAI_API_KEY");

    if (apiKey) {
      this.client = new OpenAI({ apiKey });
      this.logger.log("OpenAI client initialized");
    } else {
      this.logger.warn(
        "OPENAI_API_KEY not found, provider will be unavailable",
      );
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      // Quick health check - list models
      await this.client.models.list();
      return true;
    } catch (error) {
      this.logger.error("OpenAI availability check failed:", error.message);
      return false;
    }
  }

  async generateText(
    prompt: string,
    options?: LLMOptions,
  ): Promise<LLMResponse> {
    if (!this.client) {
      throw new Error("OpenAI client not initialized");
    }

    // Get model from DB config, fallback to options, then env, then default
    const modelConfig = await this.llmConfig.getModelConfig(
      'openai',
      'gpt-3.5-turbo'
    );
    const model = options?.model || modelConfig.model;
    const temperature = options?.temperature ?? 0.7;
    const maxTokens = options?.maxTokens ?? 500;
    const timeout = options?.timeout || 10000;

    this.logger.debug(`Generating text with model ${model}`);

    try {
      const response = await this.client.chat.completions.create(
        {
          model,
          messages: [{ role: "user", content: prompt }],
          temperature,
          max_tokens: maxTokens,
        },
        { timeout },
      );

      const text = response.choices[0]?.message?.content || "";

      return {
        text,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
        provider: this.name,
        model: response.model,
      };
    } catch (error) {
      this.logger.error(`OpenAI generation failed: ${error.message}`);
      throw error;
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.client) {
      throw new Error("OpenAI client not initialized");
    }

    try {
      const response = await this.client.embeddings.create({
        model: "text-embedding-ada-002",
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      this.logger.error(`OpenAI embedding failed: ${error.message}`);
      throw error;
    }
  }
}
