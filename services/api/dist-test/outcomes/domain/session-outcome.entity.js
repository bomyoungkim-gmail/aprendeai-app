"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionOutcome = void 0;
class SessionOutcome {
    constructor(partial) {
        var _a, _b, _c;
        Object.assign(this, partial);
        this.comprehensionScore = (_a = partial.comprehensionScore) !== null && _a !== void 0 ? _a : 0;
        this.productionScore = (_b = partial.productionScore) !== null && _b !== void 0 ? _b : 0;
        this.frustrationIndex = (_c = partial.frustrationIndex) !== null && _c !== void 0 ? _c : 0;
        this.computedAt = partial.computedAt || new Date();
    }
}
exports.SessionOutcome = SessionOutcome;
//# sourceMappingURL=session-outcome.entity.js.map