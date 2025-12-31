"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ClassroomPrivacyGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassroomPrivacyGuard = void 0;
const common_1 = require("@nestjs/common");
const types_1 = require("./types");
let ClassroomPrivacyGuard = ClassroomPrivacyGuard_1 = class ClassroomPrivacyGuard {
    constructor() {
        this.logger = new common_1.Logger(ClassroomPrivacyGuard_1.name);
    }
    filterStudentData(data, privacyMode) {
        const filtered = {
            learnerUserId: data.learnerUserId,
            nickname: data.nickname,
            progressPercent: data.progressPercent,
            lastActivityDate: data.lastActivityDate,
        };
        if (privacyMode === types_1.ClassPrivacyMode.AGGREGATED_ONLY) {
            this.logger.debug("Filtering with AGGREGATED_ONLY mode");
            return filtered;
        }
        if (privacyMode === types_1.ClassPrivacyMode.AGGREGATED_PLUS_HELP_REQUESTS) {
            this.logger.debug("Filtering with AGGREGATED_PLUS_HELP_REQUESTS mode");
            filtered.helpRequests = data.helpRequests;
            return filtered;
        }
        if (privacyMode === types_1.ClassPrivacyMode.AGGREGATED_PLUS_FLAGS) {
            this.logger.debug("Filtering with AGGREGATED_PLUS_FLAGS mode");
            filtered.comprehensionScore = data.comprehensionScore;
            filtered.struggles = data.struggles;
            return filtered;
        }
        return filtered;
    }
    filterStudentList(students, privacyMode) {
        return students.map((student) => this.filterStudentData(student, privacyMode));
    }
    canViewStudentDetails(privacyMode) {
        return (privacyMode === types_1.ClassPrivacyMode.AGGREGATED_PLUS_HELP_REQUESTS ||
            privacyMode === types_1.ClassPrivacyMode.AGGREGATED_PLUS_FLAGS);
    }
    shouldRevealDetailsOnHelpRequest(privacyMode) {
        return privacyMode === types_1.ClassPrivacyMode.AGGREGATED_PLUS_HELP_REQUESTS;
    }
};
exports.ClassroomPrivacyGuard = ClassroomPrivacyGuard;
exports.ClassroomPrivacyGuard = ClassroomPrivacyGuard = ClassroomPrivacyGuard_1 = __decorate([
    (0, common_1.Injectable)()
], ClassroomPrivacyGuard);
//# sourceMappingURL=classroom-privacy-guard.service.js.map