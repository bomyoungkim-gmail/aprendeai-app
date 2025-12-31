import { ConfigService } from "@nestjs/config";
import { LLMOptions, LLMResponse } from "./providers/llm-provider.interface";
import { OpenAIProvider } from "./providers/openai.provider";
import { GeminiProvider } from "./providers/gemini.provider";
import { AnthropicProvider } from "./providers/anthropic.provider";
import { DegradedModeProvider } from "./providers/degraded.provider";
export declare class LLMService {
    private config;
    private openaiProvider;
    private geminiProvider;
    private anthropicProvider;
    private degradedProvider;
    private readonly logger;
    private providers;
    private maxRetries;
    private retryDelay;
    constructor(config: ConfigService, openaiProvider: OpenAIProvider, geminiProvider: GeminiProvider, anthropicProvider: AnthropicProvider, degradedProvider: DegradedModeProvider);
    generateText(prompt: string, options?: LLMOptions & {
        allowDegraded?: boolean;
    }): Promise<LLMResponse>;
    generateEmbedding(text: string): Promise<number[]>;
    isAIAvailable(): Promise<boolean>;
    private isRateLimitError;
    private delay;
}
