"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Institution = void 0;
class Institution {
    constructor(partial) {
        Object.assign(this, partial);
        this.createdAt = partial.createdAt || new Date();
        this.updatedAt = partial.updatedAt || new Date();
    }
}
exports.Institution = Institution;
//# sourceMappingURL=institution.entity.js.map