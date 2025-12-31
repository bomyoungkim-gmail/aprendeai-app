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
var AiServiceClient_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiServiceClient = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
const crypto = require("crypto");
let AiServiceClient = AiServiceClient_1 = class AiServiceClient {
    constructor(httpService, configService) {
        this.httpService = httpService;
        this.configService = configService;
        this.logger = new common_1.Logger(AiServiceClient_1.name);
        this.AI_SERVICE_URL = this.configService.get("AI_SERVICE_URL", "http://localhost:8001");
        this.AI_SERVICE_SECRET =
            this.configService.getOrThrow("AI_SERVICE_SECRET");
        if (!this.AI_SERVICE_SECRET || this.AI_SERVICE_SECRET.length < 32) {
            throw new Error("AI_SERVICE_SECRET must be set and at least 32 characters. " +
                "Generate with: openssl rand -hex 32");
        }
        this.logger.log(`AI Service Client initialized: ${this.AI_SERVICE_URL}`);
        this.logger.log("HMAC Authentication: ENABLED (Phase 0)");
    }
    signRequest(body) {
        const hmac = crypto.createHmac("sha256", this.AI_SERVICE_SECRET);
        hmac.update(body);
        return `sha256=${hmac.digest("hex")}`;
    }
    async sendPrompt(promptMessage) {
        const url = `${this.AI_SERVICE_URL}/educator/turn`;
        const correlationId = promptMessage.threadId;
        const requestBody = { promptMessage };
        const bodyString = JSON.stringify(requestBody);
        const signature = this.signRequest(bodyString);
        this.logger.debug(`Sending prompt to AI Service: session=${promptMessage.readingSessionId}, correlationId=${correlationId}`);
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(url, requestBody, {
                timeout: 30000,
                headers: {
                    "Content-Type": "application/json",
                    "X-Signature": signature,
                    "X-Correlation-ID": correlationId,
                    "X-Request-ID": promptMessage.threadId,
                },
            }));
            return response.data;
        }
        catch (error) {
            this.logger.error(`AI Service call failed (correlationId=${correlationId})`, error);
            throw new Error("Failed to communicate with AI Service");
        }
    }
};
exports.AiServiceClient = AiServiceClient;
exports.AiServiceClient = AiServiceClient = AiServiceClient_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService])
], AiServiceClient);
//# sourceMappingURL=ai-service.client.js.map