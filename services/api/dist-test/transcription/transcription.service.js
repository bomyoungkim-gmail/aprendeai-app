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
var TranscriptionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranscriptionService = void 0;
const common_1 = require("@nestjs/common");
const openai_1 = require("openai");
const fs = require("fs");
let TranscriptionService = TranscriptionService_1 = class TranscriptionService {
    constructor() {
        this.logger = new common_1.Logger(TranscriptionService_1.name);
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            this.logger.warn("OPENAI_API_KEY not configured. Transcription will be unavailable.");
        }
        else {
            this.openai = new openai_1.default({ apiKey });
        }
    }
    async transcribe(filePath) {
        if (!this.openai) {
            throw new Error("OpenAI API key not configured");
        }
        try {
            this.logger.log(`Starting transcription for: ${filePath}`);
            const fileStream = fs.createReadStream(filePath);
            const response = await this.openai.audio.transcriptions.create({
                file: fileStream,
                model: "whisper-1",
                response_format: "verbose_json",
                timestamp_granularities: ["word", "segment"],
            });
            this.logger.log(`Transcription completed. Language: ${response.language}`);
            return {
                text: response.text,
                language: response.language,
                duration: response.duration,
                segments: response.segments,
                words: response.words,
            };
        }
        catch (error) {
            this.logger.error(`Transcription failed: ${error.message}`, error.stack);
            throw error;
        }
    }
    generateWebVTT(transcription) {
        let vtt = "WEBVTT\n\n";
        transcription.segments.forEach((segment, index) => {
            const startTime = this.formatTime(segment.start);
            const endTime = this.formatTime(segment.end);
            vtt += `${index + 1}\n`;
            vtt += `${startTime} --> ${endTime}\n`;
            vtt += `${segment.text.trim()}\n\n`;
        });
        return vtt;
    }
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const millis = Math.floor((seconds % 1) * 1000);
        return `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${millis
            .toString()
            .padStart(3, "0")}`;
    }
    isAvailable() {
        return !!this.openai;
    }
};
exports.TranscriptionService = TranscriptionService;
exports.TranscriptionService = TranscriptionService = TranscriptionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], TranscriptionService);
//# sourceMappingURL=transcription.service.js.map