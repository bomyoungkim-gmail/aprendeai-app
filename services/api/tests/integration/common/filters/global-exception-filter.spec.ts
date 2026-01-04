import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, HttpStatus } from "@nestjs/common";
import * as request from "supertest";
import { GlobalExceptionFilter } from "../../../../src/common/filters/global-exception.filter";
import { AppError, ErrorCode } from "../../../../src/common/domain/app-error";
import { Controller, Get, UseFilters } from "@nestjs/common";

@Controller("test-error")
@UseFilters(GlobalExceptionFilter)
class TestErrorController {
  @Get("app-error")
  throwAppError() {
    throw AppError.notFound("Resource missing", { id: 123 });
  }

  @Get("generic-error")
  throwGenericError() {
    throw new Error("Something went wrong");
  }
}

describe("GlobalExceptionFilter (Integration)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
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
      .expect(HttpStatus.NOT_FOUND)
      .expect((res) => {
        expect(res.body.code).toBe(ErrorCode.NOT_FOUND);
        expect(res.body.message).toBe("Resource missing");
        expect(res.body.details).toEqual({ id: 123 });
      });
  });

  it("should handle generic Error correctly", () => {
    return request(app.getHttpServer())
      .get("/test-error/generic-error")
      .expect(HttpStatus.INTERNAL_SERVER_ERROR)
      .expect((res) => {
        expect(res.body.code).toBe("INTERNAL_ERROR");
        expect(res.body.message).toBe("Internal server error");
      });
  });
});
