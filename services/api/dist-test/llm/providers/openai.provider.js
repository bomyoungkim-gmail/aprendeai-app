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
var OpenAIProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const openai_1 = require("openai");
const llm_config_service_1 = require("../llm-config.service");
let OpenAIProvider = OpenAIProvider_1 = class OpenAIProvider {
    constructor(config, llmConfig) {
        this.config = config;
        this.llmConfig = llmConfig;
        this.name = "openai";
        this.logger = new common_1.Logger(OpenAIProvider_1.name);
        this.client = null;
        const apiKey = this.config.get("OPENAI_API_KEY");
        if (apiKey) {
            this.client = new openai_1.default({ apiKey });
            this.logger.log("OpenAI client initialized");
        }
        else {
            this.logger.warn("OPENAI_API_KEY not found, provider will be unavailable");
        }
    }
    async isAvailable() {
        if (!this.client) {
            return false;
        }
        try {
            await this.client.models.list();
            return true;
        }
        catch (error) {
            this.logger.error("OpenAI availability check failed:", error.message);
            return false;
        }
    }
    async generateText(prompt, options) {
        var _a, _b, _c, _d, _e, _f, _g;
        if (!this.client) {
            throw new Error("OpenAI client not initialized");
        }
        const modelConfig = await this.llmConfig.getModelConfig("openai", "gpt-3.5-turbo");
        const model = (options === null || options === void 0 ? void 0 : options.model) || modelConfig.model;
        const temperature = (_a = options === null || options === void 0 ? void 0 : options.temperature) !== null && _a !== void 0 ? _a : 0.7;
        const maxTokens = (_b = options === null || options === void 0 ? void 0 : options.maxTokens) !== null && _b !== void 0 ? _b : 500;
        const timeout = (options === null || options === void 0 ? void 0 : options.timeout) || 10000;
        this.logger.debug(`Generating text with model ${model}`);
        try {
            const response = await this.client.chat.completions.create({
                model,
                messages: [{ role: "user", content: prompt }],
                temperature,
                max_tokens: maxTokens,
            }, { timeout });
            const text = ((_d = (_c = response.choices[0]) === null || _c === void 0 ? void 0 : _c.message) === null || _d === void 0 ? void 0 : _d.content) || "";
            return {
                text,
                usage: {
                    promptTokens: ((_e = response.usage) === null || _e === void 0 ? void 0 : _e.prompt_tokens) || 0,
                    completionTokens: ((_f = response.usage) === null || _f === void 0 ? void 0 : _f.completion_tokens) || 0,
                    totalTokens: ((_g = response.usage) === null || _g === void 0 ? void 0 : _g.total_tokens) || 0,
                },
                provider: this.name,
                model: response.model,
            };
        }
        catch (error) {
            this.logger.error(`OpenAI generation failed: ${error.message}`);
            throw error;
        }
    }
    async generateEmbedding(text) {
        if (!this.client) {
            throw new Error("OpenAI client not initialized");
        }
        try {
            const response = await this.client.embeddings.create({
                model: "text-embedding-ada-002",
                input: text,
            });
            return response.data[0].embedding;
        }
        catch (error) {
            this.logger.error(`OpenAI embedding failed: ${error.message}`);
            throw error;
        }
    }
};
exports.OpenAIProvider = OpenAIProvider;
exports.OpenAIProvider = OpenAIProvider = OpenAIProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        llm_config_service_1.LLMConfigService])
], OpenAIProvider);
//# sourceMappingURL=openai.provider.js.map