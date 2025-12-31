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
exports.ContentClassificationService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
let ContentClassificationService = class ContentClassificationService {
    constructor(httpService, configService) {
        this.httpService = httpService;
        this.configService = configService;
    }
    async classifyContent(content) {
        var _a, _b;
        if (((_a = content.existingClassification) === null || _a === void 0 ? void 0 : _a.ageMin) &&
            ((_b = content.existingClassification) === null || _b === void 0 ? void 0 : _b.ageMax)) {
            return content.existingClassification;
        }
        const aiClassification = await this.aiClassify(content);
        if (content.existingClassification) {
            return Object.assign(Object.assign({}, aiClassification), content.existingClassification);
        }
        return aiClassification;
    }
    async aiClassify(content) {
        const aiUrl = this.configService.get("AI_SERVICE_URL");
        const secret = this.configService.get("AI_SERVICE_SECRET");
        try {
            const response = await (0, rxjs_1.lastValueFrom)(this.httpService.post(`${aiUrl}/classify-content`, {
                title: content.title,
                description: content.description,
                body: content.body,
            }, {
                headers: {
                    "X-Hub-Signature": secret,
                },
            }));
            return {
                ageMin: response.data.ageMin,
                ageMax: response.data.ageMax,
                contentRating: this.determineRating(response.data.ageMin),
                complexity: response.data.complexity,
                topics: response.data.topics,
                confidence: response.data.confidence,
            };
        }
        catch (error) {
            console.error("AI Classification failed, falling back to local heuristic", error.message);
            const text = `${content.title} ${content.description || ""} ${content.body || ""}`.toLowerCase();
            const keywords = this.extractKeywords(text);
            const complexity = this.determineComplexity(text, keywords);
            const ageRange = this.determineAgeRange(keywords, complexity);
            return Object.assign(Object.assign({}, ageRange), { contentRating: this.determineRating(ageRange.ageMin), complexity, topics: keywords.slice(0, 5), confidence: 0.6 });
        }
    }
    extractKeywords(text) {
        const basicKeywords = [
            "abc",
            "números",
            "cores",
            "formas",
            "animais",
            "família",
        ];
        const intermediateKeywords = [
            "multiplicação",
            "divisão",
            "frações",
            "história",
            "geografia",
        ];
        const advancedKeywords = [
            "álgebra",
            "química",
            "física",
            "filosofia",
            "cálculo",
        ];
        const allKeywords = [
            ...basicKeywords,
            ...intermediateKeywords,
            ...advancedKeywords,
        ];
        return allKeywords.filter((keyword) => text.includes(keyword));
    }
    determineComplexity(text, keywords) {
        const advancedTopics = [
            "álgebra",
            "química",
            "física",
            "filosofia",
            "cálculo",
            "trigonometria",
        ];
        const intermediateTopics = [
            "multiplicação",
            "divisão",
            "frações",
            "história",
            "geografia",
        ];
        if (keywords.some((k) => advancedTopics.includes(k)))
            return "ADVANCED";
        if (keywords.some((k) => intermediateTopics.includes(k)))
            return "INTERMEDIATE";
        return "BASIC";
    }
    determineAgeRange(keywords, complexity) {
        const ranges = {
            BASIC: { ageMin: 4, ageMax: 8 },
            INTERMEDIATE: { ageMin: 8, ageMax: 12 },
            ADVANCED: { ageMin: 12, ageMax: 18 },
        };
        return ranges[complexity] || { ageMin: 6, ageMax: 12 };
    }
    determineRating(ageMin) {
        if (ageMin <= 6)
            return "G";
        if (ageMin <= 10)
            return "PG";
        if (ageMin <= 13)
            return "PG-13";
        return "TEEN";
    }
    filterContentByAge(items, familyAgeRange) {
        return items.filter((item) => {
            if (!item.ageMin || !item.ageMax)
                return true;
            return (item.ageMin >= familyAgeRange.minAge &&
                item.ageMax <= familyAgeRange.maxAge);
        });
    }
    async suggestClassification(contentId, title, description) {
        const classification = await this.aiClassify({ title, description });
        return {
            contentId,
            suggested: classification,
            message: `AI suggests: Age ${classification.ageMin}-${classification.ageMax}, ${classification.complexity} level (${Math.round(classification.confidence * 100)}% confidence)`,
            needsReview: classification.confidence < 0.8,
        };
    }
};
exports.ContentClassificationService = ContentClassificationService;
exports.ContentClassificationService = ContentClassificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService])
], ContentClassificationService);
//# sourceMappingURL=content-classification.service.js.map