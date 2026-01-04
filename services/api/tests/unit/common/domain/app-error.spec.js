"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_error_1 = require("../../../../src/common/domain/app-error");
describe("AppError", () => {
    it("should create an AppError with custom properties", () => {
        const error = new app_error_1.AppError(app_error_1.ErrorCode.BAD_REQUEST, "Test message", 400, {
            foo: "bar",
        });
        expect(error.message).toBe("Test message");
        expect(error.code).toBe(app_error_1.ErrorCode.BAD_REQUEST);
        expect(error.httpStatus).toBe(400);
        expect(error.details).toEqual({ foo: "bar" });
    });
    it("should have helper methods for common errors", () => {
        const notFound = app_error_1.AppError.notFound("User not found");
        expect(notFound.code).toBe(app_error_1.ErrorCode.NOT_FOUND);
        expect(notFound.httpStatus).toBe(404);
        const unauthorized = app_error_1.AppError.unauthorized();
        expect(unauthorized.code).toBe(app_error_1.ErrorCode.UNAUTHORIZED);
        expect(unauthorized.httpStatus).toBe(401);
        const internal = app_error_1.AppError.internal("Internal fail", { trace: "xxx" });
        expect(internal.code).toBe(app_error_1.ErrorCode.INTERNAL_ERROR);
        expect(internal.httpStatus).toBe(500);
        expect(internal.details).toEqual({ trace: "xxx" });
    });
    it("should capture stack trace", () => {
        const error = new app_error_1.AppError(app_error_1.ErrorCode.INTERNAL_ERROR, "Stack test");
        expect(error.stack).toBeDefined();
    });
});
//# sourceMappingURL=app-error.spec.js.map