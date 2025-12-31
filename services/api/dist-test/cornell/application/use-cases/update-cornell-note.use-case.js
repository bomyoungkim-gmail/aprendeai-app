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
exports.UpdateCornellNoteUseCase = void 0;
const common_1 = require("@nestjs/common");
const cornell_repository_interface_1 = require("../../domain/interfaces/cornell.repository.interface");
const usage_tracking_service_1 = require("../../../billing/usage-tracking.service");
const activity_service_1 = require("../../../activity/activity.service");
const event_emitter_1 = require("@nestjs/event-emitter");
const client_1 = require("@prisma/client");
let UpdateCornellNoteUseCase = class UpdateCornellNoteUseCase {
    constructor(cornellRepository, usageTracking, activityService, eventEmitter) {
        this.cornellRepository = cornellRepository;
        this.usageTracking = usageTracking;
        this.activityService = activityService;
        this.eventEmitter = eventEmitter;
    }
    async execute(contentId, userId, dto) {
        var _a, _b, _c;
        let note = await this.cornellRepository.findByContentAndUser(contentId, userId);
        if (!note) {
            throw new Error("Cornell note not found. Use getOrCreate first.");
        }
        await this.usageTracking.trackUsage({
            scopeType: "USER",
            scopeId: userId,
            metric: "cornell_note_save",
            quantity: 1,
            environment: this.getEnvironment(),
        });
        await this.activityService
            .trackActivity(userId, "annotation")
            .catch(() => { });
        this.eventEmitter.emit("reading.activity", {
            userId,
            contentId,
            activityType: "annotation",
        });
        note.cues = (_a = dto.cues_json) !== null && _a !== void 0 ? _a : note.cues;
        note.notes = (_b = dto.notes_json) !== null && _b !== void 0 ? _b : note.notes;
        note.summary = (_c = dto.summary_text) !== null && _c !== void 0 ? _c : note.summary;
        return this.cornellRepository.update(note);
    }
    getEnvironment() {
        const env = process.env.NODE_ENV;
        if (env === "production")
            return client_1.Environment.PROD;
        if (env === "staging")
            return client_1.Environment.STAGING;
        return client_1.Environment.DEV;
    }
};
exports.UpdateCornellNoteUseCase = UpdateCornellNoteUseCase;
exports.UpdateCornellNoteUseCase = UpdateCornellNoteUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(cornell_repository_interface_1.ICornellRepository)),
    __metadata("design:paramtypes", [Object, usage_tracking_service_1.UsageTrackingService,
        activity_service_1.ActivityService,
        event_emitter_1.EventEmitter2])
], UpdateCornellNoteUseCase);
//# sourceMappingURL=update-cornell-note.use-case.js.map