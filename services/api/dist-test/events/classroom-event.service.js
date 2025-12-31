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
exports.ClassroomEventService = void 0;
const common_1 = require("@nestjs/common");
const log_event_use_case_1 = require("./application/use-cases/log-event.use-case");
const event_repository_interface_1 = require("./domain/interfaces/event.repository.interface");
let ClassroomEventService = class ClassroomEventService {
    constructor(logEventUseCase, eventRepo) {
        this.logEventUseCase = logEventUseCase;
        this.eventRepo = eventRepo;
    }
    async logPolicySet(sessionId, userId, event) {
        return this.logEventUseCase.execute({ sessionId, userId, event });
    }
    async logWeeklyPlanCreated(sessionId, userId, event) {
        return this.logEventUseCase.execute({ sessionId, userId, event });
    }
    async logClassAlert(sessionId, userId, event) {
        return this.logEventUseCase.execute({ sessionId, userId, event });
    }
    async getClassroomEvents(classroomId, limit = 100) {
        return this.eventRepo.getClassroomEvents(classroomId, limit);
    }
    async getStudentEvents(learnerUserId, limit = 50) {
        return this.eventRepo.getStudentEvents(learnerUserId, limit);
    }
};
exports.ClassroomEventService = ClassroomEventService;
exports.ClassroomEventService = ClassroomEventService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(event_repository_interface_1.IEventRepository)),
    __metadata("design:paramtypes", [log_event_use_case_1.LogEventUseCase, Object])
], ClassroomEventService);
//# sourceMappingURL=classroom-event.service.js.map