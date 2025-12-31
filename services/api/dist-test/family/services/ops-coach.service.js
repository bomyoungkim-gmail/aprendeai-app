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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpsCoachService = void 0;
const common_1 = require("@nestjs/common");
const prompt_library_service_1 = require("../../prompts/prompt-library.service");
let OpsCoachService = class OpsCoachService {
    constructor(promptLibrary) {
        this.promptLibrary = promptLibrary;
    }
    getDailyBootLearner() {
        return this.promptLibrary.getPrompt("OPS_DAILY_BOOT_LEARNER");
    }
    getDailyBootEducator(coReadingDays) {
        const today = new Date().getDay();
        const isCoReadingDay = coReadingDays.includes(today);
        if (isCoReadingDay) {
            return this.promptLibrary.getPrompt("OPS_DAILY_BOOT_EDUCATOR", {
                DAYS: "hoje",
            });
        }
        return null;
    }
    getQueueNext(title, estMin) {
        return this.promptLibrary.getPrompt("OPS_QUEUE_NEXT", {
            TITLE: title,
            MIN: estMin,
        });
    }
    getTimeLogPrompt() {
        return this.promptLibrary.getPrompt("OPS_TIME_LOG");
    }
    getDailyCloseLearner() {
        return this.promptLibrary.getPrompt("OPS_DAILY_CLOSE_LEARNER");
    }
    getWeeklyReportEducator(streak, compAvg) {
        return this.promptLibrary.getPrompt("OPS_WEEKLY_REPORT_EDUCATOR", {
            STREAK: streak,
            COMP: compAvg,
        });
    }
    async hasDailyBootCompleted(userId, date) {
        return false;
    }
    suggestNextAction(hasDailyBoot, isCoReadingDay, queueItem) {
        if (!hasDailyBoot) {
            return this.getDailyBootLearner();
        }
        if (isCoReadingDay) {
            return this.getDailyBootEducator([new Date().getDay()]);
        }
        if (queueItem) {
            return this.getQueueNext(queueItem.title, queueItem.estMin);
        }
        return null;
    }
};
exports.OpsCoachService = OpsCoachService;
exports.OpsCoachService = OpsCoachService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prompt_library_service_1.PromptLibraryService])
], OpsCoachService);
//# sourceMappingURL=ops-coach.service.js.map