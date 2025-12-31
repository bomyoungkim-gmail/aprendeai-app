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
exports.GetContextCardsUseCase = void 0;
const common_1 = require("@nestjs/common");
const ops_repository_interface_1 = require("../../domain/interfaces/ops.repository.interface");
const context_card_entity_1 = require("../../domain/entities/context-card.entity");
let GetContextCardsUseCase = class GetContextCardsUseCase {
    constructor(opsRepo) {
        this.opsRepo = opsRepo;
    }
    async execute(userId) {
        var _a;
        const cards = [];
        const today = new Date().getDay();
        const policy = await this.opsRepo.getUserPolicy(userId);
        const isCoReadingDay = (_a = policy === null || policy === void 0 ? void 0 : policy.co_reading_days) === null || _a === void 0 ? void 0 : _a.includes(today);
        if (isCoReadingDay) {
            cards.push(new context_card_entity_1.ContextCard('co-reading-reminder', 'CO_READING', '🗓️ Co-Reading Time!', 'You have a co-reading session scheduled for today.', 'Start Session', '/families/co-sessions/start', 'blue'));
        }
        if (today === 0) {
            cards.push(new context_card_entity_1.ContextCard('weekly-plan', 'WEEKLY_PLAN', '📅 Plan Your Week', 'Take a moment to set your goals for the week ahead.', 'Create Plan', '/dashboard/planning', 'purple'));
        }
        return cards;
    }
};
exports.GetContextCardsUseCase = GetContextCardsUseCase;
exports.GetContextCardsUseCase = GetContextCardsUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(ops_repository_interface_1.IOpsRepository)),
    __metadata("design:paramtypes", [Object])
], GetContextCardsUseCase);
//# sourceMappingURL=get-context-cards.use-case.js.map