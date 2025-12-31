import { Test, TestingModule } from "@nestjs/testing";
import { ExtensionAuthService } from "./extension-auth.service";
import { PrismaService } from "../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { UnauthorizedException, BadRequestException } from "@nestjs/common";

describe("ExtensionAuthService", () => {
  let service: ExtensionAuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const mockPrisma = {
    extensionDeviceAuth: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    extensionGrant: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    users: {
      findUnique: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
    decode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExtensionAuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<ExtensionAuthService>(ExtensionAuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("startDeviceCode", () => {
    it("should generate device code and user code", async () => {
      mockPrisma.extensionDeviceAuth.create.mockResolvedValue({});

      const result = await service.startDeviceCode([
        "extension:webclip:create",
      ]);

      expect(result.deviceCode).toMatch(/^dev_[a-f0-9]{64}$/);
      // User code is ABCD-1234 (alphanumeric + dash)
      expect(result.userCode).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
      expect(result.expiresInSec).toBe(600);
      expect(mockPrisma.extensionDeviceAuth.create).toHaveBeenCalled();
    });

    it("should add default scopes if none valid provided", async () => {
      await service.startDeviceCode(["invalid:scope"]);

      expect(mockPrisma.extensionDeviceAuth.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            requestedScopes: [
              "extension:webclip:create",
              "extension:session:start",
            ],
          }),
        }),
      );
    });
  });

  describe("pollDeviceCode", () => {
    it("should return INVALID if code not found", async () => {
      mockPrisma.extensionDeviceAuth.findUnique.mockResolvedValue(null);
      const result = await service.pollDeviceCode("dev_123");
      expect(result.status).toBe("INVALID");
    });

    it("should return EXPIRED if expired", async () => {
      mockPrisma.extensionDeviceAuth.findUnique.mockResolvedValue({
        id: "1",
        expiresAt: new Date(Date.now() - 1000),
      });
      mockPrisma.extensionDeviceAuth.update.mockResolvedValue({});

      const result = await service.pollDeviceCode("dev_123");
      expect(result.status).toBe("EXPIRED");
    });

    it("should return APPROVED with tokens if status is APPROVED", async () => {
      const mockAuth = {
        id: "1",
        status: "APPROVED",
        userId: "user-1",
        clientId: "ext-1",
        requestedScopes: ["scope1"],
        expiresAt: new Date(Date.now() + 10000),
      };

      mockPrisma.extensionDeviceAuth.findUnique.mockResolvedValue(mockAuth);
      mockPrisma.extensionDeviceAuth.delete.mockResolvedValue({});
      mockPrisma.extensionGrant.create.mockResolvedValue({});
      mockPrisma.users.findUnique.mockResolvedValue({
        id: "user-1",
        email: "test@test.com",
        system_role: "USER",
        context_role: "OWNER",
        institution_id: null,
      });
      mockJwtService.sign.mockReturnValue("mock_token");
      mockJwtService.decode.mockReturnValue({ jti: "mock_jti" });

      const result = await service.pollDeviceCode("dev_123");

      expect(result.status).toBe("APPROVED");
      expect(result.accessToken).toBe("mock_token");
      expect(result.refreshToken).toBeDefined();
      expect(mockPrisma.extensionDeviceAuth.delete).toHaveBeenCalled();
    });
  });

  describe("approveDeviceCode", () => {
    it("should approve code", async () => {
      mockPrisma.extensionDeviceAuth.findUnique.mockResolvedValue({
        id: "1",
        status: "PENDING",
        expiresAt: new Date(Date.now() + 10000),
      });

      await service.approveDeviceCode("ABCD-1234", "user-1", true);

      expect(mockPrisma.extensionDeviceAuth.update).toHaveBeenCalledWith({
        where: { id: "1" },
        data: { status: "APPROVED", userId: "user-1" },
      });
    });

    it("should throw if code expired", async () => {
      mockPrisma.extensionDeviceAuth.findUnique.mockResolvedValue({
        id: "1",
        status: "PENDING",
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(
        service.approveDeviceCode("code", "user", true),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("refreshToken", () => {
    it("should refresh token if valid", async () => {
      mockPrisma.extensionGrant.findUnique.mockResolvedValue({
        id: "1",
        userId: "u1",
        scopes: [],
        clientId: "c1",
      });
      mockPrisma.users.findUnique.mockResolvedValue({
        id: "u1",
        email: "test@test.com",
        system_role: "USER",
        context_role: "OWNER",
        institution_id: null,
      });
      mockJwtService.sign.mockReturnValue("new_token");

      const result = await service.refreshToken("rft_123");

      expect(result.accessToken).toBe("new_token");
      expect(mockPrisma.extensionGrant.update).toHaveBeenCalledTimes(2); // LastUsed + JTI
    });

    it("should throw if revoked", async () => {
      mockPrisma.extensionGrant.findUnique.mockResolvedValue({
        id: "1",
        revokedAt: new Date(),
      });

      await expect(service.refreshToken("rft_123")).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
