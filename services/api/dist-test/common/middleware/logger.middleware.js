"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionLoggerMiddleware = void 0;
const common_1 = require("@nestjs/common");
let ActionLoggerMiddleware = class ActionLoggerMiddleware {
    constructor() {
        this.logger = new common_1.Logger("HTTP");
    }
    use(req, res, next) {
        const { method, originalUrl } = req;
        const start = Date.now();
        const requestId = req["id"] || "-";
        res.on("finish", () => {
            var _a;
            const { statusCode } = res;
            const duration = Date.now() - start;
            const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || "anonymous";
            this.logger.log(`[${requestId}] ${method} ${originalUrl} ${statusCode} - ${userId} - ${duration}ms`);
        });
        next();
    }
};
exports.ActionLoggerMiddleware = ActionLoggerMiddleware;
exports.ActionLoggerMiddleware = ActionLoggerMiddleware = __decorate([
    (0, common_1.Injectable)()
], ActionLoggerMiddleware);
//# sourceMappingURL=logger.middleware.js.map