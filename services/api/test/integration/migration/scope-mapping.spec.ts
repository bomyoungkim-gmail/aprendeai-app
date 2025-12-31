import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "src/prisma/prisma.service";
import { v4 as uuidv4 } from "uuid";
import { ContentType, SystemRole, Language } from "@prisma/client";

describe("Migration: Scope & Ownership Mapping (Subfase 5.1)", () => {
  let prisma: PrismaService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await module.close();
  });

  describe("Legacy User Role Mapping", () => {
    it("should verify legacy ADMIN mapping in DB", async () => {
      // Create legacy admin
      const admin = await prisma.users.create({
        data: {
          id: uuidv4(),
          email: `legacy-admin-${uuidv4()}@example.com`,
          name: "Legacy Admin",
          password_hash: "hash",
          system_role: SystemRole.ADMIN, // Use Enum
          schooling_level: "Ensino Médio",
          updated_at: new Date(),
        },
      });

      // Verification
      expect(admin.system_role).toBe("ADMIN");

      // Cleanup
      await prisma.users.delete({ where: { id: admin.id } });
    });
  });

  describe("Legacy Content Ownership", () => {
    it("should verify content creation with legacy owner_user_id", async () => {
      const user = await prisma.users.create({
        data: {
          id: uuidv4(),
          email: `legacy-content-user-${uuidv4()}@example.com`,
          name: "Legacy Content User",
          password_hash: "hash",
          schooling_level: "Superior",
          updated_at: new Date(),
        },
      });

      const content = await prisma.contents.create({
        data: {
          id: uuidv4(),
          title: "Legacy Content",
          type: ContentType.ARTICLE,
          owner_user_id: user.id, // Legacy field
          raw_text: "Legacy content body",
          original_language: Language.PT_BR,
          updated_at: new Date(),
        },
      });

      // Verify DB Persistence
      const retrieved = await prisma.contents.findUnique({
        where: { id: content.id },
      });
      expect(retrieved).toBeDefined();
      expect(retrieved?.owner_user_id).toBe(user.id);
      expect(retrieved?.owner_type).toBe(null); // Default check

      // Cleanup
      await prisma.contents.delete({ where: { id: content.id } });
      await prisma.users.delete({ where: { id: user.id } });
    });
  });
});
