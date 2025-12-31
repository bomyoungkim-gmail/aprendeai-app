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
exports.TrackActivityUseCase = void 0;
const common_1 = require("@nestjs/common");
const activity_repository_interface_1 = require("../../domain/interfaces/activity.repository.interface");
const date_fns_1 = require("date-fns");
let TrackActivityUseCase = class TrackActivityUseCase {
    constructor(activityRepo) {
        this.activityRepo = activityRepo;
    }
    async execute(userId, type, minutes = 1) {
        const today = (0, date_fns_1.startOfDay)(new Date());
        const data = {
            minutesStudied: type === 'study' ? minutes : 0,
            sessionsCount: type === 'session' ? 1 : 0,
            contentsRead: type === 'read' ? 1 : 0,
            annotationsCreated: type === 'annotation' ? 1 : 0,
        };
        await this.activityRepo.track(userId, today, data);
    }
};
exports.TrackActivityUseCase = TrackActivityUseCase;
exports.TrackActivityUseCase = TrackActivityUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(activity_repository_interface_1.IActivityRepository)),
    __metadata("design:paramtypes", [Object])
], TrackActivityUseCase);
//# sourceMappingURL=track-activity.use-case.js.map