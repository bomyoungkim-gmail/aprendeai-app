"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIContentModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ai_content_service_1 = require("./ai-content.service");
const llm_module_1 = require("../../llm/llm.module");
let AIContentModule = class AIContentModule {
};
exports.AIContentModule = AIContentModule;
exports.AIContentModule = AIContentModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, llm_module_1.LLMModule],
        providers: [ai_content_service_1.AIContentService],
        exports: [ai_content_service_1.AIContentService],
    })
], AIContentModule);
//# sourceMappingURL=ai-content.module.js.map