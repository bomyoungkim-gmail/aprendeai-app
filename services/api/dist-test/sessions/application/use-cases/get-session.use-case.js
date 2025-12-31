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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetSessionUseCase = void 0;
const common_1 = require("@nestjs/common");
const sessions_repository_interface_1 = require("../../domain/sessions.repository.interface");
let GetSessionUseCase = class GetSessionUseCase {
    constructor(sessionsRepository) {
        this.sessionsRepository = sessionsRepository;
    }
    async execute(sessionId, userId) {
        const session = await this.sessionsRepository.findById(sessionId);
        if (!session) {
            throw new common_1.NotFoundException("Session not found");
        }
        if (session.userId !== userId) {
            throw new common_1.ForbiddenException("Access denied");
        }
        const events = session.events || [];
        const messages = events
            .filter((event) => event.payload && typeof event.payload === 'object')
            .filter((event) => event.payload.role || event.payload.text || event.payload.content)
            .map((event) => ({
            id: event.id,
            role: event.payload.role || "SYSTEM",
            content: event.payload.text || event.payload.content || event.payload.message || "",
            timestamp: event.createdAt,
        }));
        const lastEventWithReplies = [...events]
            .reverse()
            .find((e) => { var _a; return (_a = e.payload) === null || _a === void 0 ? void 0 : _a.quickReplies; });
        const quickReplies = lastEventWithReplies
            ? lastEventWithReplies.payload.quickReplies
            : [];
        return {
            session,
            content: session.content,
            messages,
            quickReplies,
        };
    }
};
exports.GetSessionUseCase = GetSessionUseCase;
exports.GetSessionUseCase = GetSessionUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(sessions_repository_interface_1.ISessionsRepository)),
    __metadata("design:paramtypes", [Object])
], GetSessionUseCase);
//# sourceMappingURL=get-session.use-case.js.map