import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { TeacherVerifiedGuard } from "./teacher-verified.guard";
import { PrismaService } from "../../prisma/prisma.service";

describe("TeacherVerifiedGuard", () => {
  let guard: TeacherVerifiedGuard;
  let prisma: PrismaService;

  const mockPrisma = {
    teacherVerification: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeacherVerifiedGuard,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    guard = module.get<TeacherVerifiedGuard>(TeacherVerifiedGuard);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockContext = (user: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as any;

  it("should allow access for verified teachers", async () => {
    mockPrisma.teacherVerification.findUnique.mockResolvedValueOnce({
      status: "VERIFIED",
    });

    const context = createMockContext({ id: "user-123" });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockPrisma.teacherVerification.findUnique).toHaveBeenCalledWith({
      where: { userId: "user-123" },
      select: { status: true },
    });
  });

  it("should deny access for unverified teachers (PENDING)", async () => {
    mockPrisma.teacherVerification.findUnique.mockResolvedValueOnce({
      status: "PENDING",
    });

    const context = createMockContext({ id: "user-123" });

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
    await expect(guard.canActivate(context)).rejects.toThrow(/status: PENDING/);
  });

  it("should deny access for rejected teachers", async () => {
    mockPrisma.teacherVerification.findUnique.mockResolvedValueOnce({
      status: "REJECTED",
    });

    const context = createMockContext({ id: "user-123" });

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it("should deny access when no verification exists", async () => {
    mockPrisma.teacherVerification.findUnique.mockResolvedValueOnce(null);

    const context = createMockContext({ id: "user-123" });

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
    await expect(guard.canActivate(context)).rejects.toThrow(
      /verification required/,
    );
  });

  it("should deny access when user is not authenticated", async () => {
    const context = createMockContext(null);

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
    await expect(guard.canActivate(context)).rejects.toThrow(
      /not authenticated/,
    );
  });

  it("should deny access when user has no id", async () => {
    const context = createMockContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });
});
