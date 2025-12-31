import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RolesGuard } from "./roles.guard";
import { SystemRole, ContextRole } from "@prisma/client";

describe("RolesGuard", () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  const createMockContext = (user: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    }) as any;

  describe("canActivate", () => {
    it("should allow access when no roles are required", () => {
      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(null);

      const context = createMockContext({ id: "user-123" });

      expect(guard.canActivate(context)).toBe(true);
    });

    it("should deny access when user is not authenticated", () => {
      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(["ADMIN"]);

      const context = createMockContext(null);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it("should allow access when user has matching systemRole", () => {
      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([SystemRole.ADMIN]);

      const context = createMockContext({
        id: "user-123",
        systemRole: SystemRole.ADMIN,
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it("should allow access when user has matching contextRole", () => {
      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([ContextRole.TEACHER]);

      const context = createMockContext({
        id: "user-123",
        contextRole: ContextRole.TEACHER,
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it("should allow access when user has ANY matching role (tri-check)", () => {
      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([SystemRole.ADMIN, ContextRole.TEACHER]);

      const context = createMockContext({
        id: "user-123",
        systemRole: "STUDENT", // doesn't match
        contextRole: ContextRole.TEACHER, // matches!
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it("should deny access when no roles match", () => {
      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([SystemRole.ADMIN]);

      const context = createMockContext({
        id: "user-123",
        systemRole: "STUDENT",
        contextRole: ContextRole.TEACHER,
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        "Insufficient permissions",
      );
    });

    it("should handle user with only new role fields", () => {
      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([SystemRole.ADMIN]);

      const context = createMockContext({
        id: "user-123",
        systemRole: SystemRole.ADMIN,
        contextRole: ContextRole.TEACHER,
      });

      expect(guard.canActivate(context)).toBe(true);
    });
  });
});
