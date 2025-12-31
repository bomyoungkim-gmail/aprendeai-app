"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SrsService = void 0;
const common_1 = require("@nestjs/common");
const date_fns_1 = require("date-fns");
const INTERVALS = {
    NEW: 0,
    D1: 1,
    D3: 3,
    D7: 7,
    D14: 14,
    D30: 30,
    D60: 60,
    MASTERED: 180,
};
const STAGE_ORDER = [
    "NEW",
    "D1",
    "D3",
    "D7",
    "D14",
    "D30",
    "D60",
    "MASTERED",
];
let SrsService = class SrsService {
    calculateNextDue(currentStage, result) {
        if (result === "FAIL") {
            return {
                newStage: "D1",
                dueDate: (0, date_fns_1.addDays)(new Date(), 1),
                daysToAdd: 1,
                lapseIncrement: 1,
            };
        }
        if (result === "HARD") {
            const regressed = this.regressStage(currentStage, 1);
            const days = INTERVALS[regressed];
            return {
                newStage: regressed,
                dueDate: (0, date_fns_1.addDays)(new Date(), days),
                daysToAdd: days,
                lapseIncrement: 0,
            };
        }
        if (result === "OK") {
            const next = this.progressStage(currentStage, 1);
            const days = INTERVALS[next];
            return {
                newStage: next,
                dueDate: (0, date_fns_1.addDays)(new Date(), days),
                daysToAdd: days,
                lapseIncrement: 0,
            };
        }
        if (result === "EASY") {
            const next = this.progressStage(currentStage, 2);
            const days = INTERVALS[next];
            return {
                newStage: next,
                dueDate: (0, date_fns_1.addDays)(new Date(), days),
                daysToAdd: days,
                lapseIncrement: 0,
            };
        }
        return {
            newStage: currentStage,
            dueDate: (0, date_fns_1.addDays)(new Date(), INTERVALS[currentStage]),
            daysToAdd: INTERVALS[currentStage],
            lapseIncrement: 0,
        };
    }
    regressStage(current, steps) {
        const currentIndex = STAGE_ORDER.indexOf(current);
        const newIndex = Math.max(1, currentIndex - steps);
        return STAGE_ORDER[newIndex];
    }
    progressStage(current, steps) {
        const currentIndex = STAGE_ORDER.indexOf(current);
        const newIndex = Math.min(STAGE_ORDER.length - 1, currentIndex + steps);
        return STAGE_ORDER[newIndex];
    }
    getStageInterval(stage) {
        return INTERVALS[stage];
    }
    calculateMasteryDelta(result) {
        switch (result) {
            case "FAIL":
                return -20;
            case "HARD":
                return -5;
            case "OK":
                return +10;
            case "EASY":
                return +15;
            default:
                return 0;
        }
    }
};
exports.SrsService = SrsService;
exports.SrsService = SrsService = __decorate([
    (0, common_1.Injectable)()
], SrsService);
//# sourceMappingURL=srs.service.js.map