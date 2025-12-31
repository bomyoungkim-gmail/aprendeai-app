"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setRequestContext = setRequestContext;
exports.getRequestContext = getRequestContext;
exports.getCurrentUser = getCurrentUser;
exports.getCurrentInstitutionId = getCurrentInstitutionId;
exports.getCorrelationId = getCorrelationId;
const async_hooks_1 = require("async_hooks");
const asyncLocalStorage = new async_hooks_1.AsyncLocalStorage();
function setRequestContext(context) {
    asyncLocalStorage.enterWith(context);
}
function getRequestContext() {
    return asyncLocalStorage.getStore();
}
function getCurrentUser() {
    var _a;
    return (_a = getRequestContext()) === null || _a === void 0 ? void 0 : _a.user;
}
function getCurrentInstitutionId() {
    var _a;
    return (_a = getCurrentUser()) === null || _a === void 0 ? void 0 : _a.institutionId;
}
function getCorrelationId() {
    var _a;
    return (_a = getRequestContext()) === null || _a === void 0 ? void 0 : _a.correlationId;
}
//# sourceMappingURL=request-context.js.map