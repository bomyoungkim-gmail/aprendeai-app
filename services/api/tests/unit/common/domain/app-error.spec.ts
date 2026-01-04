import { AppError, ErrorCode } from "../../../../src/common/domain/app-error";

describe("AppError", () => {
  it("should create an AppError with custom properties", () => {
    const error = new AppError(ErrorCode.BAD_REQUEST, "Test message", 400, {
      foo: "bar",
    });

    expect(error.message).toBe("Test message");
    expect(error.code).toBe(ErrorCode.BAD_REQUEST);
    expect(error.httpStatus).toBe(400);
    expect(error.details).toEqual({ foo: "bar" });
  });

  it("should have helper methods for common errors", () => {
    const notFound = AppError.notFound("User not found");
    expect(notFound.code).toBe(ErrorCode.NOT_FOUND);
    expect(notFound.httpStatus).toBe(404);

    const unauthorized = AppError.unauthorized();
    expect(unauthorized.code).toBe(ErrorCode.UNAUTHORIZED);
    expect(unauthorized.httpStatus).toBe(401);

    const internal = AppError.internal("Internal fail", { trace: "xxx" });
    expect(internal.code).toBe(ErrorCode.INTERNAL_ERROR);
    expect(internal.httpStatus).toBe(500);
    expect(internal.details).toEqual({ trace: "xxx" });
  });

  it("should capture stack trace", () => {
    const error = new AppError(ErrorCode.INTERNAL_ERROR, "Stack test");
    expect(error.stack).toBeDefined();
  });
});
