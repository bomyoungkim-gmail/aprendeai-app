"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const request = require("supertest");
const global_exception_filter_1 = require("../../../../src/common/filters/global-exception.filter");
const app_error_1 = require("../../../../src/common/domain/app-error");
const common_2 = require("@nestjs/common");
let TestErrorController = class TestErrorController {
    throwAppError() {
        throw app_error_1.AppError.notFound("Resource missing", { id: 123 });
    }
    throwGenericError() {
        throw new Error("Something went wrong");
    }
};
__decorate([
    (0, common_2.Get)("app-error"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TestErrorController.prototype, "throwAppError", null);
__decorate([
    (0, common_2.Get)("generic-error"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TestErrorController.prototype, "throwGenericError", null);
TestErrorController = __decorate([
    (0, common_2.Controller)("test-error"),
    (0, common_2.UseFilters)(global_exception_filter_1.GlobalExceptionFilter)
], TestErrorController);
describe("GlobalExceptionFilter (Integration)", () => {
    let app;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            controllers: [TestErrorController],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
    });
    afterAll(async () => {
        await app.close();
    });
    it("should handle AppError correctly", () => {
        return request(app.getHttpServer())
            .get("/test-error/app-error")
            .expect(common_1.HttpStatus.NOT_FOUND)
            .expect((res) => {
            expect(res.body.code).toBe(app_error_1.ErrorCode.NOT_FOUND);
            expect(res.body.message).toBe("Resource missing");
            expect(res.body.details).toEqual({ id: 123 });
        });
    });
    it("should handle generic Error correctly", () => {
        return request(app.getHttpServer())
            .get("/test-error/generic-error")
            .expect(common_1.HttpStatus.INTERNAL_SERVER_ERROR)
            .expect((res) => {
            expect(res.body.code).toBe("INTERNAL_ERROR");
            expect(res.body.message).toBe("Internal server error");
        });
    });
});
//# sourceMappingURL=global-exception-filter.spec.js.map