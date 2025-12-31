"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuickCommandParser = void 0;
const common_1 = require("@nestjs/common");
let QuickCommandParser = class QuickCommandParser {
    parse(text, metadata) {
        const trimmed = text.trim();
        const events = [];
        if (trimmed.startsWith("/mark unknown:")) {
            const wordsText = trimmed.substring("/mark unknown:".length).trim();
            const words = wordsText
                .split(",")
                .map((w) => w.trim())
                .filter((w) => w);
            for (const word of words) {
                events.push({
                    eventType: "MARK_UNKNOWN_WORD",
                    payloadJson: {
                        word,
                        language: this.inferLanguage(word),
                        origin: "READ",
                        blockId: metadata.blockId,
                        chunkId: metadata.chunkId,
                    },
                });
            }
            return events;
        }
        if (trimmed.startsWith("/keyidea:")) {
            const excerpt = trimmed.substring("/keyidea:".length).trim();
            events.push({
                eventType: "MARK_KEY_IDEA",
                payloadJson: {
                    blockId: metadata.blockId || "unknown",
                    excerpt,
                },
            });
            return events;
        }
        if (trimmed.startsWith("/checkpoint:")) {
            const answer = trimmed.substring("/checkpoint:".length).trim();
            events.push({
                eventType: "CHECKPOINT_RESPONSE",
                payloadJson: {
                    blockId: metadata.blockId || "unknown",
                    questionId: "generated",
                    answerText: answer,
                },
            });
            return events;
        }
        const productionMatch = trimmed.match(/^\/production\s+(FREE_RECALL|SENTENCES|ORAL|OPEN_DIALOGUE):\s*(.+)$/i);
        if (productionMatch) {
            const [, type, text] = productionMatch;
            events.push({
                eventType: "PRODUCTION_SUBMIT",
                payloadJson: {
                    type: type,
                    text: text.trim(),
                },
            });
            return events;
        }
        return events;
    }
    inferLanguage(word) {
        if (/[\uac00-\ud7af]/.test(word)) {
            return "KO";
        }
        const commonEnglish = [
            "the",
            "is",
            "are",
            "was",
            "were",
            "have",
            "has",
            "had",
            "do",
            "does",
            "did",
        ];
        if (commonEnglish.includes(word.toLowerCase()) ||
            /^[a-z]+$/.test(word.toLowerCase())) {
            return "EN";
        }
        return "PT";
    }
};
exports.QuickCommandParser = QuickCommandParser;
exports.QuickCommandParser = QuickCommandParser = __decorate([
    (0, common_1.Injectable)()
], QuickCommandParser);
//# sourceMappingURL=quick-command.parser.js.map