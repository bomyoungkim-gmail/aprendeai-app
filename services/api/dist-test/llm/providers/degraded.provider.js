"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var DegradedModeProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DegradedModeProvider = void 0;
const common_1 = require("@nestjs/common");
let DegradedModeProvider = DegradedModeProvider_1 = class DegradedModeProvider {
    constructor() {
        this.name = "degraded";
        this.logger = new common_1.Logger(DegradedModeProvider_1.name);
    }
    async isAvailable() {
        return true;
    }
    async generateText(prompt, options) {
        this.logger.warn("Using degraded mode - AI service unavailable");
        return {
            text: "AI service is temporarily unavailable. Please try again later or contact support if the issue persists.",
            provider: this.name,
            model: "none",
        };
    }
    async generateEmbedding(text) {
        this.logger.warn("Using degraded mode for embeddings - returning zero vector");
        return new Array(1536).fill(0);
    }
};
exports.DegradedModeProvider = DegradedModeProvider;
exports.DegradedModeProvider = DegradedModeProvider = DegradedModeProvider_1 = __decorate([
    (0, common_1.Injectable)()
], DegradedModeProvider);
//# sourceMappingURL=degraded.provider.js.map