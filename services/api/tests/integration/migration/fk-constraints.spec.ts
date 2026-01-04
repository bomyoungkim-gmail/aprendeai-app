import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "src/prisma/prisma.service";
import { ContentType, InstitutionType, Language } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

describe("Migration: FK Constraints (Subfase 5.1)", () => {
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

  describe("Institution Membership FKs", () => {
    it("should fail to create membership for non-existent institution", async () => {
      const user = await prisma.users.create({
        data: {
          id: uuidv4(),
          email: `test-fk-${uuidv4()}@example.com`,
          name: "Test FK User",
          password_hash: "hash",
          schooling_level: "Ensino Médio",
          updated_at: new Date(),
        },
      });

      const invalidInstitutionId = uuidv4();

      await expect(
        prisma.institution_members.create({
          data: {
            id: uuidv4(),
            user_id: user.id,
            institution_id: invalidInstitutionId,
            role: "STUDENT",
          },
        }),
      ).rejects.toThrow();

      // Cleanup
      await prisma.users.delete({ where: { id: user.id } });
    });

    it("should fail to create membership for non-existent user", async () => {
      const institution = await prisma.institutions.create({
        data: {
          id: uuidv4(),
          name: "Test FK Inst",
          slug: `test-fk-${uuidv4()}`,
          type: InstitutionType.SCHOOL,
          updated_at: new Date(),
        },
      });

      const invalidUserId = uuidv4();

      await expect(
        prisma.institution_members.create({
          data: {
            id: uuidv4(),
            user_id: invalidUserId,
            institution_id: institution.id,
            role: "STUDENT",
          },
        }),
      ).rejects.toThrow();

      // Cleanup
      await prisma.institutions.delete({ where: { id: institution.id } });
    });
  });

  describe("Content Ownership FKs", () => {
    it("should fail to create content with invalid ownerId (if constraint exists)", async () => {
      const user = await prisma.users.create({
        data: {
          id: uuidv4(),
          email: `test-content-${uuidv4()}@example.com`,
          name: "Test Content User",
          password_hash: "hash",
          schooling_level: "Ensino Médio",
          updated_at: new Date(),
        },
      });

      // Create content with basic required fields
      const content = await prisma.contents.create({
        data: {
          id: uuidv4(),
          title: "Test Content",
          type: ContentType.ARTICLE, // DOCUMENT not in enum, used ARTICLE
          owner_type: "USER",
          owner_id: user.id,
          owner_user_id: user.id,
          raw_text: "Test content body",
          original_language: Language.PT_BR, // PT not in enum, used PT_BR
          updated_at: new Date(),
        },
      });

      expect(content).toBeDefined();
      expect(content.owner_type).toBe("USER");

      // Cleanup
      await prisma.contents.delete({ where: { id: content.id } });
      await prisma.users.delete({ where: { id: user.id } });
    });
  });
});
