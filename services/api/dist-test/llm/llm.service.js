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
var LLMService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const openai_provider_1 = require("./providers/openai.provider");
const gemini_provider_1 = require("./providers/gemini.provider");
const anthropic_provider_1 = require("./providers/anthropic.provider");
const degraded_provider_1 = require("./providers/degraded.provider");
let LLMService = LLMService_1 = class LLMService {
    constructor(config, openaiProvider, geminiProvider, anthropicProvider, degradedProvider) {
        this.config = config;
        this.openaiProvider = openaiProvider;
        this.geminiProvider = geminiProvider;
        this.anthropicProvider = anthropicProvider;
        this.degradedProvider = degradedProvider;
        this.logger = new common_1.Logger(LLMService_1.name);
        this.providers = [
            geminiProvider,
            anthropicProvider,
            openaiProvider,
            degradedProvider,
        ];
        this.maxRetries = this.config.get("LLM_MAX_RETRIES", 3);
        this.retryDelay = this.config.get("LLM_RETRY_DELAY", 1000);
        this.logger.log(`LLM Service initialized with ${this.providers.length} providers`);
    }
    async generateText(prompt, options) {
        var _a;
        const allowDegraded = (_a = options === null || options === void 0 ? void 0 : options.allowDegraded) !== null && _a !== void 0 ? _a : true;
        for (const provider of this.providers) {
            if (provider.name === "degraded" && !allowDegraded) {
                this.logger.debug("Skipping degraded mode (not allowed)");
                continue;
            }
            const isAvailable = await provider.isAvailable();
            if (!isAvailable) {
                this.logger.warn(`Provider ${provider.name} is not available, trying next...`);
                continue;
            }
            for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
                try {
                    this.logger.debug(`Attempting to generate text with ${provider.name} (attempt ${attempt}/${this.maxRetries})`);
                    const response = await provider.generateText(prompt, options);
                    this.logger.log(`Successfully generated text with ${provider.name}`);
                    return response;
                }
                catch (error) {
                    this.logger.error(`Attempt ${attempt} failed with ${provider.name}: ${error.message}`);
                    if (this.isRateLimitError(error)) {
                        this.logger.warn(`Rate limit/quota exceeded for ${provider.name}, moving to fallback`);
                        break;
                    }
                    if (attempt === this.maxRetries) {
                        this.logger.warn(`All ${this.maxRetries} attempts failed with ${provider.name}`);
                        break;
                    }
                    await this.delay(this.retryDelay * attempt);
                }
            }
        }
        throw new Error("All LLM providers failed. AI features temporarily unavailable.");
    }
    async generateEmbedding(text) {
        for (const provider of this.providers) {
            const isAvailable = await provider.isAvailable();
            if (!isAvailable) {
                continue;
            }
            try {
                return await provider.generateEmbedding(text);
            }
            catch (error) {
                this.logger.error(`Embedding failed with ${provider.name}: ${error.message}`);
                continue;
            }
        }
        throw new Error("All LLM providers failed to generate embedding");
    }
    async isAIAvailable() {
        for (const provider of this.providers) {
            if (provider.name !== "degraded" && (await provider.isAvailable())) {
                return true;
            }
        }
        return false;
    }
    isRateLimitError(error) {
        var _a, _b;
        return ((error === null || error === void 0 ? void 0 : error.status) === 429 ||
            (error === null || error === void 0 ? void 0 : error.code) === "insufficient_quota" ||
            (error === null || error === void 0 ? void 0 : error.code) === "rate_limit_exceeded" ||
            ((_a = error === null || error === void 0 ? void 0 : error.message) === null || _a === void 0 ? void 0 : _a.includes("rate limit")) ||
            ((_b = error === null || error === void 0 ? void 0 : error.message) === null || _b === void 0 ? void 0 : _b.includes("quota")));
    }
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
};
exports.LLMService = LLMService;
exports.LLMService = LLMService = LLMService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        openai_provider_1.OpenAIProvider,
        gemini_provider_1.GeminiProvider,
        anthropic_provider_1.AnthropicProvider,
        degraded_provider_1.DegradedModeProvider])
], LLMService);
//# sourceMappingURL=llm.service.js.map