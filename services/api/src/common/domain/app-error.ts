export enum ErrorCode {
  NOT_FOUND = "NOT_FOUND",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  BAD_REQUEST = "BAD_REQUEST",
  CONFLICT = "CONFLICT",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  BAD_GATEWAY = "BAD_GATEWAY",
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly httpStatus: number;
  public readonly details?: any;
  public readonly cause?: Error;

  constructor(
    code: ErrorCode,
    message: string,
    httpStatus: number = 500,
    details?: any,
    cause?: Error,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
    this.cause = cause;
    Error.captureStackTrace(this, this.constructor);
  }

  static notFound(message: string = "Resource not found", details?: any) {
    return new AppError(ErrorCode.NOT_FOUND, message, 404, details);
  }

  static unauthorized(message: string = "Unauthorized", details?: any) {
    return new AppError(ErrorCode.UNAUTHORIZED, message, 401, details);
  }

  static forbidden(message: string = "Forbidden", details?: any) {
    return new AppError(ErrorCode.FORBIDDEN, message, 403, details);
  }

  static badRequest(message: string = "Bad request", details?: any) {
    return new AppError(ErrorCode.BAD_REQUEST, message, 400, details);
  }

  static conflict(message: string = "Conflict", details?: any) {
    return new AppError(ErrorCode.CONFLICT, message, 409, details);
  }

  static internal(
    message: string = "Internal server error",
    details?: any,
    cause?: Error,
  ) {
    return new AppError(ErrorCode.INTERNAL_ERROR, message, 500, details, cause);
  }

  static validation(message: string = "Validation failed", details?: any) {
    return new AppError(ErrorCode.VALIDATION_ERROR, message, 400, details);
  }
}
