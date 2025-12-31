"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureFlag = void 0;
class FeatureFlag {
    constructor(partial) {
        Object.assign(this, partial);
        this.createdAt = partial.createdAt || new Date();
        this.updatedAt = partial.updatedAt || new Date();
    }
}
exports.FeatureFlag = FeatureFlag;
//# sourceMappingURL=feature-flag.entity.js.map