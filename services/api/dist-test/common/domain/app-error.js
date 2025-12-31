"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = exports.ErrorCode = void 0;
var ErrorCode;
(function (ErrorCode) {
    ErrorCode["NOT_FOUND"] = "NOT_FOUND";
    ErrorCode["UNAUTHORIZED"] = "UNAUTHORIZED";
    ErrorCode["FORBIDDEN"] = "FORBIDDEN";
    ErrorCode["BAD_REQUEST"] = "BAD_REQUEST";
    ErrorCode["CONFLICT"] = "CONFLICT";
    ErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    ErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorCode["BAD_GATEWAY"] = "BAD_GATEWAY";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
class AppError extends Error {
    constructor(code, message, httpStatus = 500, details, cause) {
        super(message);
        this.name = "AppError";
        this.code = code;
        this.httpStatus = httpStatus;
        this.details = details;
        this.cause = cause;
        Error.captureStackTrace(this, this.constructor);
    }
    static notFound(message = "Resource not found", details) {
        return new AppError(ErrorCode.NOT_FOUND, message, 404, details);
    }
    static unauthorized(message = "Unauthorized", details) {
        return new AppError(ErrorCode.UNAUTHORIZED, message, 401, details);
    }
    static forbidden(message = "Forbidden", details) {
        return new AppError(ErrorCode.FORBIDDEN, message, 403, details);
    }
    static badRequest(message = "Bad request", details) {
        return new AppError(ErrorCode.BAD_REQUEST, message, 400, details);
    }
    static conflict(message = "Conflict", details) {
        return new AppError(ErrorCode.CONFLICT, message, 409, details);
    }
    static internal(message = "Internal server error", details, cause) {
        return new AppError(ErrorCode.INTERNAL_ERROR, message, 500, details, cause);
    }
    static validation(message = "Validation failed", details) {
        return new AppError(ErrorCode.VALIDATION_ERROR, message, 400, details);
    }
}
exports.AppError = AppError;
//# sourceMappingURL=app-error.js.map