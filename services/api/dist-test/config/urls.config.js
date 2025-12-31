"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_URL = exports.AI_SERVICE_URL = exports.FRONTEND_URL = exports.URL_CONFIG = void 0;
const NODE_ENV = process.env.NODE_ENV || "development";
const IS_PRODUCTION = NODE_ENV === "production";
const IS_TEST = NODE_ENV === "test";
function requireInProduction(envVar, fallback) {
    const value = process.env[envVar];
    if (!value) {
        if (IS_PRODUCTION) {
            throw new Error(`❌ FATAL: ${envVar} environment variable is required in production but not set.`);
        }
        if (IS_TEST) {
            if (fallback === undefined) {
                return "";
            }
            return fallback;
        }
        if (fallback) {
            console.warn(`⚠️  ${envVar} not set, using fallback: ${fallback}`);
            return fallback;
        }
        throw new Error(`${envVar} is required but not set`);
    }
    return value;
}
function getWithFallback(envVar, devFallback) {
    return process.env[envVar] || (IS_TEST ? devFallback : devFallback);
}
exports.URL_CONFIG = {
    frontend: {
        base: requireInProduction("FRONTEND_URL", "http://localhost:3000"),
        get verify() {
            return `${this.base}/extension/verify`;
        },
    },
    ai: {
        base: requireInProduction("AI_SERVICE_URL", "http://localhost:8001"),
        get educator() {
            return `${this.base}/educator/turn`;
        },
        get health() {
            return `${this.base}/health`;
        },
        get simplify() {
            return `${this.base}/simplify`;
        },
        get assessment() {
            return `${this.base}/generate-assessment`;
        },
        get pedagogicalEnrich() {
            return `${this.base}/api/pedagogical/enrich`;
        },
    },
    api: {
        base: getWithFallback("API_URL", "http://localhost:4000"),
        get health() {
            return `${this.base}/health`;
        },
    },
    oauth: {
        get google() {
            return (process.env.GOOGLE_CALLBACK_URL ||
                `${exports.URL_CONFIG.api.base}/auth/google/callback`);
        },
        get microsoft() {
            return (process.env.MICROSOFT_CALLBACK_URL ||
                `${exports.URL_CONFIG.api.base}/auth/microsoft/callback`);
        },
    },
    storage: {
        base: getWithFallback("STORAGE_BASE_URL", "http://localhost:3000"),
    },
    get corsOrigins() {
        const origins = process.env.CORS_ORIGINS;
        if (origins) {
            return origins.split(",").map((o) => o.trim());
        }
        return IS_PRODUCTION
            ? [exports.URL_CONFIG.frontend.base]
            : ["http://localhost:3000"];
    },
};
exports.FRONTEND_URL = exports.URL_CONFIG.frontend.base;
exports.AI_SERVICE_URL = exports.URL_CONFIG.ai.base;
exports.API_URL = exports.URL_CONFIG.api.base;
if (IS_PRODUCTION) {
    try {
        const _ = [exports.URL_CONFIG.frontend.base, exports.URL_CONFIG.ai.base];
    }
    catch (error) {
        console.error("❌ URL Configuration validation failed:", error);
        process.exit(1);
    }
}
exports.default = exports.URL_CONFIG;
//# sourceMappingURL=urls.config.js.map