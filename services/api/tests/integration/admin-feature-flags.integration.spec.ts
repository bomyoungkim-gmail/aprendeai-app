import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../../src/app.module";
import { PrismaService } from "../../src/prisma/prisma.service";
import { TestAuthHelper } from "../helpers/auth.helper";
import { ContextRole, SystemRole } from "@prisma/client";
import { ConfigService } from "@nestjs/config";

describe("Admin Feature Flags (Integration)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let adminUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    const configService = app.get<ConfigService>(ConfigService);
    const jwtSecret = configService.get<string>("JWT_SECRET");

    const authHelper = new TestAuthHelper(jwtSecret);

    // Create Admin User
    const adminUser = await prisma.users.upsert({
        where: { email: "admin-integration@test.com" },
        create: {
            name: "Admin Integration",
            email: "admin-integration@test.com",
            password_hash: "hashed",
            system_role: SystemRole.ADMIN,
            last_context_role: ContextRole.OWNER, // Admin usually has broader access
        },
        update: { system_role: SystemRole.ADMIN }
    });
    adminUserId = adminUser.id;

    authToken = authHelper.generateToken({
        id: adminUserId,
        email: adminUser.email,
        name: adminUser.name,
    });
  });

  afterAll(async () => {
      await prisma.feature_flags.deleteMany({ where: { created_by: adminUserId } });
      await prisma.users.delete({ where: { id: adminUserId } });
      await app.close();
  });

  it("POST /admin/feature-flags should create a new flag", async () => {
      const flagData = {
          key: "integration-test-flag",
          name: "Integration Test Flag",
          description: "Created by integration test",
          enabled: true,
          environment: "DEVELOPMENT",
          scopeType: "GLOBAL"
      };

      const res = await request(app.getHttpServer())
        .post("/admin/feature-flags")
        .set("Authorization", `Bearer ${authToken}`)
        .send(flagData)
        .expect(201);

      expect(res.body.key).toBe(flagData.key);
      expect(res.body.id).toBeDefined();

      // Verify in DB
      const dbFlag = await prisma.feature_flags.findUnique({ where: { key: flagData.key }});
      expect(dbFlag).toBeDefined();
      expect(dbFlag.enabled).toBe(true);
  });

  it("GET /admin/feature-flags should list flags", async () => {
      const res = await request(app.getHttpServer())
        .get("/admin/feature-flags")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);
      
      expect(Array.isArray(res.body)).toBe(true);
      const createdFlag = res.body.find((f: any) => f.key === "integration-test-flag");
      expect(createdFlag).toBeDefined();
  });
});
