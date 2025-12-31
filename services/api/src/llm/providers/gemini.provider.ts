import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { LLMProvider, LLMOptions, LLMResponse } from "./llm-provider.interface";
import { LLMConfigService } from "../llm-config.service";

@Injectable()
export class GeminiProvider implements LLMProvider {
  name = "gemini";
  private readonly logger = new Logger(GeminiProvider.name);
  private client: GoogleGenerativeAI | null = null;

  constructor(
    private config: ConfigService,
    private llmConfig: LLMConfigService,
  ) {
    const apiKey = this.config.get<string>("GOOGLE_API_KEY");

    if (apiKey) {
      this.client = new GoogleGenerativeAI(apiKey);
      this.logger.log("Gemini client initialized");
    } else {
      this.logger.warn("GOOGLE_API_KEY not found, Gemini provider unavailable");
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
      throw new Error("Gemini client not initialized");
    }

    // Get model from DB config, fallback to options, then default
    const modelConfig = await this.llmConfig.getModelConfig(
      "gemini",
      "gemini-1.5-flash",
    );
    const modelName = options?.model || modelConfig.model;
    const model = this.client.getGenerativeModel({
      model: modelName,
      generationConfig: {
        maxOutputTokens: options?.maxTokens,
        temperature: options?.temperature,
      },
    });

    try {
      this.logger.debug(`Generating text with model ${modelName}`);
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      return {
        text,
        provider: this.name,
        model: modelName,
      };
    } catch (error) {
      this.logger.error(`Gemini generation failed: ${error.message}`);
      throw error;
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.client) {
      throw new Error("Gemini client not initialized");
    }

    try {
      const model = this.client.getGenerativeModel({ model: "embedding-001" });
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      this.logger.error(`Gemini embedding failed: ${error.message}`);
      throw error;
    }
  }
}
