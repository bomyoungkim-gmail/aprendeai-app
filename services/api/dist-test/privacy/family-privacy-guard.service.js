"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var FamilyPrivacyGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FamilyPrivacyGuard = void 0;
const common_1 = require("@nestjs/common");
const types_1 = require("./types");
let FamilyPrivacyGuard = FamilyPrivacyGuard_1 = class FamilyPrivacyGuard {
    constructor() {
        this.logger = new common_1.Logger(FamilyPrivacyGuard_1.name);
    }
    filterDashboardData(data, privacyMode) {
        const filtered = {
            streakDays: data.streakDays,
            minutesTotal: data.minutesTotal,
            comprehensionAvg: data.comprehensionAvg,
            comprehensionTrend: data.comprehensionTrend,
        };
        if (privacyMode === types_1.PrivacyMode.AGGREGATED_ONLY) {
            this.logger.debug("Filtering with AGGREGATED_ONLY mode");
            return filtered;
        }
        if (privacyMode === types_1.PrivacyMode.AGGREGATED_PLUS_TRIGGERS) {
            this.logger.debug("Filtering with AGGREGATED_PLUS_TRIGGERS mode");
            filtered.topBlockers = data.topBlockers;
            filtered.alerts = this.sanitizeAlerts(data.alerts);
            return filtered;
        }
        return filtered;
    }
    sanitizeAlerts(alerts) {
        if (!alerts)
            return undefined;
        return alerts.map((alert) => ({
            type: alert.type,
            severity: alert.severity,
        }));
    }
    canViewField(field, privacyMode) {
        const alwaysAllowed = [
            "streakDays",
            "minutesTotal",
            "comprehensionAvg",
            "comprehensionTrend",
        ];
        if (alwaysAllowed.includes(field)) {
            return true;
        }
        const triggersAllowed = [
            "topBlockers",
            "alerts",
        ];
        if (privacyMode === types_1.PrivacyMode.AGGREGATED_PLUS_TRIGGERS &&
            triggersAllowed.includes(field)) {
            return true;
        }
        return false;
    }
    maskTextualContent(text) {
        return "[Content hidden for privacy]";
    }
};
exports.FamilyPrivacyGuard = FamilyPrivacyGuard;
exports.FamilyPrivacyGuard = FamilyPrivacyGuard = FamilyPrivacyGuard_1 = __decorate([
    (0, common_1.Injectable)()
], FamilyPrivacyGuard);
//# sourceMappingURL=family-privacy-guard.service.js.map