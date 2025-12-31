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
var VocabCaptureListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VocabCaptureListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const vocab_service_1 = require("../../vocab/vocab.service");
let VocabCaptureListener = VocabCaptureListener_1 = class VocabCaptureListener {
    constructor(vocabService) {
        this.vocabService = vocabService;
        this.logger = new common_1.Logger(VocabCaptureListener_1.name);
    }
    async handleSessionEvents(payload) {
        if (payload.eventTypes.includes("MARK_UNKNOWN_WORD")) {
            this.logger.log(`Triggering vocab capture for session ${payload.sessionId}`);
            try {
                const result = await this.vocabService.createFromUnknownWords(payload.sessionId);
                this.logger.log(`Vocab capture complete: ${result.created} words added for session ${payload.sessionId}`);
            }
            catch (error) {
                this.logger.error(`Failed to capture vocabulary for session ${payload.sessionId}`, error);
            }
        }
    }
};
exports.VocabCaptureListener = VocabCaptureListener;
__decorate([
    (0, event_emitter_1.OnEvent)("session.events.created"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VocabCaptureListener.prototype, "handleSessionEvents", null);
exports.VocabCaptureListener = VocabCaptureListener = VocabCaptureListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [vocab_service_1.VocabService])
], VocabCaptureListener);
//# sourceMappingURL=vocab-capture.listener.js.map