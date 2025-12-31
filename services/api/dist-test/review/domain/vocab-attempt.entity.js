"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VocabAttempt = void 0;
class VocabAttempt {
    constructor(partial) {
        Object.assign(this, partial);
        this.createdAt = partial.createdAt || new Date();
    }
}
exports.VocabAttempt = VocabAttempt;
//# sourceMappingURL=vocab-attempt.entity.js.map