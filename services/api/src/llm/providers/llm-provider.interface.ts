/**
 * LLM Provider Interface
 *
 * Base interface for all LLM providers (OpenAI, Gemini, etc.)
 */

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
  timeout?: number;
}

export interface LLMResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  provider: string;
  model: string;
}

export interface LLMProvider {
  name: string;

  /**
   * Check if provider is available and healthy
   */
  isAvailable(): Promise<boolean>;

  /**
   * Generate text from prompt
   */
  generateText(prompt: string, options?: LLMOptions): Promise<LLMResponse>;

  /**
   * Generate embeddings for text
   */
  generateEmbedding(text: string): Promise<number[]>;
}
