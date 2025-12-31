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
var LogEventUseCase_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogEventUseCase = void 0;
const common_1 = require("@nestjs/common");
const event_repository_interface_1 = require("../../domain/interfaces/event.repository.interface");
const event_schemas_1 = require("../../schemas/event-schemas");
const crypto = require("crypto");
let LogEventUseCase = LogEventUseCase_1 = class LogEventUseCase {
    constructor(eventRepo) {
        this.eventRepo = eventRepo;
        this.logger = new common_1.Logger(LogEventUseCase_1.name);
    }
    async execute(dto) {
        const eventType = dto.event.type;
        const schema = event_schemas_1.EventSchemas[eventType];
        if (!schema) {
            this.logger.error(`Unknown event type: ${eventType}`);
            throw new Error(`Unknown event type: ${eventType}`);
        }
        const validatedPayload = schema.parse(dto.event);
        const isRealSessionId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.sessionId);
        const isFakeSessionId = dto.sessionId.startsWith('policy_') ||
            dto.sessionId.startsWith('plan_') ||
            dto.sessionId.startsWith('help_');
        const domainEvent = {
            id: crypto.randomUUID(),
            sessionId: (isRealSessionId && !isFakeSessionId) ? dto.sessionId : undefined,
            type: eventType,
            payload: validatedPayload,
            userId: dto.userId,
            createdAt: new Date(),
        };
        await this.eventRepo.persist(domainEvent);
    }
};
exports.LogEventUseCase = LogEventUseCase;
exports.LogEventUseCase = LogEventUseCase = LogEventUseCase_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(event_repository_interface_1.IEventRepository)),
    __metadata("design:paramtypes", [Object])
], LogEventUseCase);
//# sourceMappingURL=log-event.use-case.js.map