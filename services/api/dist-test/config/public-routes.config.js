"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PUBLIC_ROUTES = void 0;
exports.isPublicRoute = isPublicRoute;
exports.getPublicRoutePrefixes = getPublicRoutePrefixes;
exports.PUBLIC_ROUTES = [
    "/api/v1/health",
    "/api/v1/auth/login",
    "/api/v1/auth/register",
    "/api/v1/auth/refresh",
    "/api/v1/auth/google",
    "/api/v1/auth/microsoft",
    "/api/v1/auth/forgot-password",
    "/api/v1/auth/reset-password",
    "/api/v1/auth/extension/register",
    "/api/v1/auth/extension/login",
    "/api/v1/auth/extension/exchange",
];
function isPublicRoute(path) {
    return exports.PUBLIC_ROUTES.some((route) => path.startsWith(route));
}
function getPublicRoutePrefixes() {
    return [...exports.PUBLIC_ROUTES];
}
//# sourceMappingURL=public-routes.config.js.map