"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Vocabulary = void 0;
class Vocabulary {
    constructor(partial) {
        var _a, _b;
        Object.assign(this, partial);
        this.masteryScore = (_a = partial.masteryScore) !== null && _a !== void 0 ? _a : 0;
        this.lapsesCount = (_b = partial.lapsesCount) !== null && _b !== void 0 ? _b : 0;
    }
}
exports.Vocabulary = Vocabulary;
//# sourceMappingURL=vocabulary.entity.js.map