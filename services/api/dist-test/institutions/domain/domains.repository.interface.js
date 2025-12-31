"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IDomainsRepository = exports.InstitutionDomain = void 0;
class InstitutionDomain {
    constructor(partial) {
        Object.assign(this, partial);
        this.createdAt = partial.createdAt || new Date();
    }
}
exports.InstitutionDomain = InstitutionDomain;
exports.IDomainsRepository = Symbol("IDomainsRepository");
//# sourceMappingURL=domains.repository.interface.js.map