import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { AppError } from "../domain/app-error";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = "Internal server error";
    let code = "INTERNAL_ERROR";
    let details: any = undefined;

    if (exception instanceof AppError) {
      status = exception.httpStatus;
      message = exception.message;
      code = exception.code;
      details = exception.details;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message =
        typeof res === "object" && (res as any).message
          ? (res as any).message
          : res;
      code = (res as any).error || "HTTP_ERROR";
    }

    // Log the error
    const errorLog = `${request.method} ${request.url} - ${status} - ${code}`;
    this.logger.error(
      errorLog,
      exception instanceof Error ? exception.stack : String(exception),
    );

    // Send response
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      code,
      message,
      details,
    });
  }
}
