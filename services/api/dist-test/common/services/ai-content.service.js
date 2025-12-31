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
var AIContentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIContentService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const llm_service_1 = require("../../llm/llm.service");
let AIContentService = AIContentService_1 = class AIContentService {
    constructor(configService, llmService) {
        this.configService = configService;
        this.llmService = llmService;
        this.logger = new common_1.Logger(AIContentService_1.name);
    }
    async simplifyText(params) {
        var _a, _b;
        const { text, targetLevel, targetLanguage } = params;
        const levelDescriptions = {
            "1_EF": "primeira série do ensino fundamental (6-7 anos)",
            "2_EF": "segunda série do ensino fundamental (7-8 anos)",
            "3_EF": "terceira série do ensino fundamental (8-9 anos)",
            "4_EF": "quarta série do ensino fundamental (9-10 anos)",
            "5_EF": "quinta série do ensino fundamental (10-11 anos)",
            "6_EF": "sexta série do ensino fundamental (11-12 anos)",
            "7_EF": "sétima série do ensino fundamental (12-13 anos)",
            "8_EF": "oitava série do ensino fundamental (13-14 anos)",
            "9_EF": "nona série do ensino fundamental (14-15 anos)",
            "1_EM": "primeira série do ensino médio (15-16 anos)",
            "2_EM": "segunda série do ensino médio (16-17 anos)",
            "3_EM": "terceira série do ensino médio (17-18 anos)",
        };
        const prompt = `
Você é um professor especializado em adaptar textos pedagógicos.

TAREFA: Simplifique o texto abaixo para o nível de ${levelDescriptions[targetLevel] || targetLevel}.

REQUISITOS:
- Use vocabulário apropriado para a idade
- Frases curtas e diretas
- Explique termos complexos de forma simples
- Mantenha as ideias principais
- Idioma: ${targetLanguage === "PT_BR" ? "Português do Brasil" : targetLanguage}

TEXTO ORIGINAL:
${text}

FORMATO DE RESPOSTA (JSON ONLY):
{
  "simplifiedText": "texto simplificado aqui",
  "summary": "resumo breve em 1-2 frases"
}
`;
        try {
            const result = await this.llmService.generateText(prompt, {
                temperature: 0.3,
                maxTokens: 2000,
            });
            const response = result.text;
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    simplifiedText: parsed.simplifiedText,
                    summary: parsed.summary,
                };
            }
            return {
                simplifiedText: response,
                summary: `Texto simplificado para ${targetLevel}`,
            };
        }
        catch (error) {
            this.logger.error(`AI Simplification full failure: ${error.message}`);
            if (((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes("QUOTA")) ||
                ((_b = error.message) === null || _b === void 0 ? void 0 : _b.includes("rate limit"))) {
                throw new Error("QUOTA_EXCEEDED");
            }
            throw new Error("AI_PROCESSING_ERROR");
        }
    }
    async generateAssessment(params) {
        var _a, _b;
        const { text, level, questionCount = 5 } = params;
        const prompt = `
Você é um professor criando questões de avaliação.

TAREFA: Crie ${questionCount} questões de múltipla escolha baseadas no texto abaixo, apropriadas para o nível ${level}.

REQUISITOS:
- Questões claras e objetivas
- 4 alternativas por questão
- Apenas 1 alternativa correta
- Explicação para a resposta correta
- Variar dificuldade das questões

TEXTO:
${text.substring(0, 3000)}

FORMATO DE RESPOSTA (JSON Array ONLY):
[
  {
    "questionText": "Pergunta aqui?",
    "questionType": "MULTIPLE_CHOICE",
    "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
    "correctAnswer": "Opção A",
    "explanation": "Explicação da resposta correta"
  }
]
`;
        try {
            const result = await this.llmService.generateText(prompt, {
                temperature: 0.5,
            });
            const response = result.text;
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const questions = JSON.parse(jsonMatch[0]);
                return { questions };
            }
            throw new Error("Could not parse AI response");
        }
        catch (error) {
            this.logger.error(`AI Assessment generation failure: ${error.message}`);
            if (((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes("QUOTA")) ||
                ((_b = error.message) === null || _b === void 0 ? void 0 : _b.includes("rate limit"))) {
                throw new Error("QUOTA_EXCEEDED");
            }
            throw new Error("AI_PROCESSING_ERROR");
        }
    }
};
exports.AIContentService = AIContentService;
exports.AIContentService = AIContentService = AIContentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        llm_service_1.LLMService])
], AIContentService);
//# sourceMappingURL=ai-content.service.js.map