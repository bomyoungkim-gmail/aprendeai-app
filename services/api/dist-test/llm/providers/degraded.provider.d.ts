import { LLMProvider, LLMOptions, LLMResponse } from "./llm-provider.interface";
export declare class DegradedModeProvider implements LLMProvider {
    name: string;
    private readonly logger;
    isAvailable(): Promise<boolean>;
    generateText(prompt: string, options?: LLMOptions): Promise<LLMResponse>;
    generateEmbedding(text: string): Promise<number[]>;
}
