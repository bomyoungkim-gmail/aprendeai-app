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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptLibraryService = void 0;
const common_1 = require("@nestjs/common");
const prompts = require("./canonical-prompts.json");
let PromptLibraryService = class PromptLibraryService {
    constructor() {
        this.prompts = new Map(prompts.map((p) => [p.key, p]));
    }
    getPrompt(key, variables) {
        const prompt = this.prompts.get(key);
        if (!prompt) {
            throw new Error(`Prompt not found: ${key}`);
        }
        if (!variables) {
            return prompt;
        }
        return Object.assign(Object.assign({}, prompt), { nextPrompt: this.interpolate(prompt.nextPrompt, variables), quickReplies: prompt.quickReplies.map((reply) => this.interpolate(reply, variables)) });
    }
    getPromptsByAudience(audience) {
        return Array.from(this.prompts.values()).filter((p) => p.audience === audience);
    }
    getPromptsByPhase(phase) {
        return Array.from(this.prompts.values()).filter((p) => p.phase === phase);
    }
    interpolate(template, variables) {
        return template.replace(/\{(\w+)\}/g, (_, key) => {
            const value = variables[key];
            if (value === undefined) {
                return `{${key}}`;
            }
            return String(value);
        });
    }
};
exports.PromptLibraryService = PromptLibraryService;
exports.PromptLibraryService = PromptLibraryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PromptLibraryService);
//# sourceMappingURL=prompt-library.service.js.map