"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMModule = void 0;
const common_1 = require("@nestjs/common");
const llm_service_1 = require("./llm.service");
const llm_config_service_1 = require("./llm-config.service");
const openai_provider_1 = require("./providers/openai.provider");
const gemini_provider_1 = require("./providers/gemini.provider");
const anthropic_provider_1 = require("./providers/anthropic.provider");
const degraded_provider_1 = require("./providers/degraded.provider");
const prisma_module_1 = require("../prisma/prisma.module");
let LLMModule = class LLMModule {
};
exports.LLMModule = LLMModule;
exports.LLMModule = LLMModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        providers: [
            llm_service_1.LLMService,
            llm_config_service_1.LLMConfigService,
            openai_provider_1.OpenAIProvider,
            gemini_provider_1.GeminiProvider,
            anthropic_provider_1.AnthropicProvider,
            degraded_provider_1.DegradedModeProvider,
        ],
        exports: [llm_service_1.LLMService, llm_config_service_1.LLMConfigService],
    })
], LLMModule);
//# sourceMappingURL=llm.module.js.map