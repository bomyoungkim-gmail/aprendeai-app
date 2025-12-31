export declare enum ErrorCode {
    NOT_FOUND = "NOT_FOUND",
    UNAUTHORIZED = "UNAUTHORIZED",
    FORBIDDEN = "FORBIDDEN",
    BAD_REQUEST = "BAD_REQUEST",
    CONFLICT = "CONFLICT",
    INTERNAL_ERROR = "INTERNAL_ERROR",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    BAD_GATEWAY = "BAD_GATEWAY"
}
export declare class AppError extends Error {
    readonly code: ErrorCode;
    readonly httpStatus: number;
    readonly details?: any;
    readonly cause?: Error;
    constructor(code: ErrorCode, message: string, httpStatus?: number, details?: any, cause?: Error);
    static notFound(message?: string, details?: any): AppError;
    static unauthorized(message?: string, details?: any): AppError;
    static forbidden(message?: string, details?: any): AppError;
    static badRequest(message?: string, details?: any): AppError;
    static conflict(message?: string, details?: any): AppError;
    static internal(message?: string, details?: any, cause?: Error): AppError;
    static validation(message?: string, details?: any): AppError;
}
