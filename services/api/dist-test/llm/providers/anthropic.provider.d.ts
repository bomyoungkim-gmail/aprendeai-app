import { ConfigService } from "@nestjs/config";
import { LLMProvider, LLMOptions, LLMResponse } from "./llm-provider.interface";
import { LLMConfigService } from "../llm-config.service";
export declare class AnthropicProvider implements LLMProvider {
    private config;
    private llmConfig;
    name: string;
    private readonly logger;
    private client;
    constructor(config: ConfigService, llmConfig: LLMConfigService);
    isAvailable(): Promise<boolean>;
    generateText(prompt: string, options?: LLMOptions): Promise<LLMResponse>;
    generateEmbedding(text: string): Promise<number[]>;
}
