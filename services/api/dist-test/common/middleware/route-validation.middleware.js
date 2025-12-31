"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouteValidationMiddleware = void 0;
const common_1 = require("@nestjs/common");
let RouteValidationMiddleware = class RouteValidationMiddleware {
    use(req, res, next) {
        const { path, method } = req;
        const idPattern = /\/([a-f0-9-]{36}|[a-zA-Z0-9_-]+)/g;
        const ids = path.match(idPattern);
        if (ids) {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            ids.forEach((id) => {
                const cleanId = id.substring(1);
                if (cleanId.includes("_") || cleanId.length < 8) {
                    return;
                }
                const skipWords = [
                    "families",
                    "classrooms",
                    "co-sessions",
                    "teachback",
                    "policy",
                    "dashboard",
                    "reports",
                    "enrollments",
                    "interventions",
                    "plans",
                ];
                if (skipWords.includes(cleanId)) {
                    return;
                }
                if (cleanId.startsWith("fam_") ||
                    cleanId.startsWith("class_") ||
                    cleanId.startsWith("user_")) {
                    return;
                }
                if (cleanId.length === 36 && !uuidRegex.test(cleanId)) {
                    throw new common_1.BadRequestException(`Invalid ID format: ${cleanId}`);
                }
            });
        }
        next();
    }
};
exports.RouteValidationMiddleware = RouteValidationMiddleware;
exports.RouteValidationMiddleware = RouteValidationMiddleware = __decorate([
    (0, common_1.Injectable)()
], RouteValidationMiddleware);
//# sourceMappingURL=route-validation.middleware.js.map