import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "./../src/app.module"; // Adjust relative path as needed
import { PrismaService } from "./../src/prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";

describe("Advanced Integrations (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let adminToken: string;
  let institutionAdminToken: string;
  let studentToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);
    await app.init();

    // 1. Create Test Users/Institutions if not exist
    // Setup Admin
    const admin = await prisma.user.upsert({
      where: { email: "admin_e2e@test.com" },
      update: {},
      create: {
        email: "admin_e2e@test.com",
        name: "Admin E2E",
        schoolingLevel: "HIGHER_EDUCATION",
        passwordHash: "hash",
        role: "ADMIN",
      },
    });
    adminToken = jwtService.sign({
      sub: admin.id,
      role: "ADMIN",
      email: admin.email,
    });

    // Setup Institution + Admin
    const inst = await prisma.institution.create({
      data: {
        name: "E2E Institution",
        slug: `e2e-inst-${Date.now()}`,
        type: "UNIVERSITY",

      },
    });

    const instAdmin = await prisma.user.create({
      data: {
        email: `inst_admin_${Date.now()}@e2e.edu`,
        name: "Inst Admin",
        schoolingLevel: "HIGHER_EDUCATION",
        role: "INSTITUTION_ADMIN",
        institutionMemberships: {
          create: {
            institutionId: inst.id,
            role: "ADMIN",
            status: "ACTIVE",
          },
        },
      },
    });
    institutionAdminToken = jwtService.sign({
      sub: instAdmin.id,
      role: "INSTITUTION_ADMIN",
      email: instAdmin.email,
    });
  });

  afterAll(async () => {
    // Cleanup if needed, or leave for DB reset
    await app.close();
  });

  describe("User Context (/users/me/context)", () => {
    it("should return context with institution info", () => {
      return request(app.getHttpServer())
        .get("/users/me/context")
        .set("Authorization", `Bearer ${institutionAdminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("userId");
          expect(res.body).toHaveProperty("institutionId");
          expect(res.body.institutionRole).toBe("ADMIN");
        });
    });
  });

  describe("Bulk Endpoints (/institutions/:id/bulk-invite)", () => {
    it("should upload CSV and process invites", async () => {
      // Need to get the institution ID first
      const me = await request(app.getHttpServer())
        .get("/users/me/context")
        .set("Authorization", `Bearer ${institutionAdminToken}`);

      const instId = me.body.institutionId;

      const csvContent =
        "email,name,role\ntest1@e2e.edu,Test One,STUDENT\ntest2@e2e.edu,Test Two,TEACHER";
      const buffer = Buffer.from(csvContent, "utf-8");

      return request(app.getHttpServer())
        .post(`/institutions/${instId}/bulk-invite`)
        .set("Authorization", `Bearer ${institutionAdminToken}`)
        .attach("file", buffer, "users.csv")
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty("success");
          expect(res.body.success).toBe(2);
        });
    });
  });

  // Note: We cannot easily test the AI external call in E2E without mocking the HTTP service
  // But we can test that the structure exists if we had a mock mode.
  // For now, these cover the critical database integrations.
});
