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
    isAvailable(): Promise<boolean>;
    generateText(prompt: string, options?: LLMOptions): Promise<LLMResponse>;
    generateEmbedding(text: string): Promise<number[]>;
}
