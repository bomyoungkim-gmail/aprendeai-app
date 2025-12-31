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
var GeminiProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const generative_ai_1 = require("@google/generative-ai");
const llm_config_service_1 = require("../llm-config.service");
let GeminiProvider = GeminiProvider_1 = class GeminiProvider {
    constructor(config, llmConfig) {
        this.config = config;
        this.llmConfig = llmConfig;
        this.name = "gemini";
        this.logger = new common_1.Logger(GeminiProvider_1.name);
        this.client = null;
        const apiKey = this.config.get("GOOGLE_API_KEY");
        if (apiKey) {
            this.client = new generative_ai_1.GoogleGenerativeAI(apiKey);
            this.logger.log("Gemini client initialized");
        }
        else {
            this.logger.warn("GOOGLE_API_KEY not found, Gemini provider unavailable");
        }
    }
    async isAvailable() {
        return !!this.client;
    }
    async generateText(prompt, options) {
        if (!this.client) {
            throw new Error("Gemini client not initialized");
        }
        const modelConfig = await this.llmConfig.getModelConfig("gemini", "gemini-1.5-flash");
        const modelName = (options === null || options === void 0 ? void 0 : options.model) || modelConfig.model;
        const model = this.client.getGenerativeModel({
            model: modelName,
            generationConfig: {
                maxOutputTokens: options === null || options === void 0 ? void 0 : options.maxTokens,
                temperature: options === null || options === void 0 ? void 0 : options.temperature,
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
        }
        catch (error) {
            this.logger.error(`Gemini generation failed: ${error.message}`);
            throw error;
        }
    }
    async generateEmbedding(text) {
        if (!this.client) {
            throw new Error("Gemini client not initialized");
        }
        try {
            const model = this.client.getGenerativeModel({ model: "embedding-001" });
            const result = await model.embedContent(text);
            return result.embedding.values;
        }
        catch (error) {
            this.logger.error(`Gemini embedding failed: ${error.message}`);
            throw error;
        }
    }
};
exports.GeminiProvider = GeminiProvider;
exports.GeminiProvider = GeminiProvider = GeminiProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        llm_config_service_1.LLMConfigService])
], GeminiProvider);
//# sourceMappingURL=gemini.provider.js.map