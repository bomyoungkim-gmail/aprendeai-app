"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AnthropicProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnthropicProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const sdk_1 = require("@anthropic-ai/sdk");
const llm_config_service_1 = require("../llm-config.service");
let AnthropicProvider = AnthropicProvider_1 = class AnthropicProvider {
    constructor(config, llmConfig) {
        this.config = config;
        this.llmConfig = llmConfig;
        this.name = "anthropic";
        this.logger = new common_1.Logger(AnthropicProvider_1.name);
        this.client = null;
        const apiKey = this.config.get("ANTHROPIC_API_KEY");
        if (apiKey) {
            this.client = new sdk_1.default({ apiKey });
            this.logger.log("Anthropic client initialized");
        }
        else {
            this.logger.warn("ANTHROPIC_API_KEY not found, provider will be unavailable");
        }
    }
    async isAvailable() {
        return !!this.client;
    }
    async generateText(prompt, options) {
        var _a, _b;
        if (!this.client) {
            throw new Error("Anthropic client not initialized");
        }
        const modelConfig = await this.llmConfig.getModelConfig("anthropic", "claude-3-sonnet-20240229");
        const model = (options === null || options === void 0 ? void 0 : options.model) || modelConfig.model;
        const temperature = (_a = options === null || options === void 0 ? void 0 : options.temperature) !== null && _a !== void 0 ? _a : 0.7;
        const maxTokens = (_b = options === null || options === void 0 ? void 0 : options.maxTokens) !== null && _b !== void 0 ? _b : 1024;
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
            const text = (textContent === null || textContent === void 0 ? void 0 : textContent.type) === "text" ? textContent.text : "";
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
        }
        catch (error) {
            this.logger.error(`Anthropic generation failed: ${error.message}`);
            throw error;
        }
    }
    async generateEmbedding(text) {
        this.logger.warn("Anthropic does not support embeddings");
        throw new Error("Anthropic provider does not support embeddings");
    }
};
exports.AnthropicProvider = AnthropicProvider;
exports.AnthropicProvider = AnthropicProvider = AnthropicProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        llm_config_service_1.LLMConfigService])
], AnthropicProvider);
//# sourceMappingURL=anthropic.provider.js.map