import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ContentModeService } from "../../cornell/content-mode.service";
import { ContentMode, Language } from "@prisma/client";

/**
 * Integration Tests for Script 02 (RB-CONTENT-MODE)
 * Tests end-to-end flow: content creation → mode inference → persistence
 */
describe("Content Mode Integration (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let contentModeService: ContentModeService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, ContentModeService],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    contentModeService =
      moduleFixture.get<ContentModeService>(ContentModeService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe("AC1: ARXIV content → SCIENTIFIC mode", () => {
    it("should automatically set mode=SCIENTIFIC for ARXIV content", async () => {
      // Create ARXIV content
      const content = await prisma.contents.create({
        data: {
          id: "test-arxiv-" + Date.now(),
          type: "ARXIV",
          title: "Machine Learning Research Paper",
          original_language: Language.EN,
          raw_text: "Abstract: This paper presents a novel approach...",
        },
      });

      // Get mode (should trigger inference and persistence)
      const mode = await contentModeService.getMode(content.id);

      // Verify
      expect(mode).toBe(ContentMode.SCIENTIFIC);

      // Check DB persistence
      const updated = await prisma.contents.findUnique({
        where: { id: content.id },
        select: {
          mode: true,
          mode_source: true,
          mode_set_by: true,
          mode_set_at: true,
        },
      });

      expect(updated.mode).toBe("SCIENTIFIC");
      expect(updated.mode_source).toBe("HEURISTIC");
      expect(updated.mode_set_by).toBe("SYSTEM");
      expect(updated.mode_set_at).toBeTruthy();

      // Cleanup
      await prisma.contents.delete({ where: { id: content.id } });
    });
  });

  describe("AC2: NEWS content → NEWS mode", () => {
    it("should automatically set mode=NEWS for NEWS content", async () => {
      // Create NEWS content
      const content = await prisma.contents.create({
        data: {
          id: "test-news-" + Date.now(),
          type: "NEWS",
          title: "Breaking News: Major Event",
          original_language: Language.PT_BR,
          raw_text: "Hoje aconteceu um evento importante...",
        },
      });

      // Get mode
      const mode = await contentModeService.getMode(content.id);

      // Verify
      expect(mode).toBe(ContentMode.NEWS);

      // Check DB
      const updated = await prisma.contents.findUnique({
        where: { id: content.id },
        select: { mode: true, mode_source: true },
      });

      expect(updated.mode).toBe("NEWS");
      expect(updated.mode_source).toBe("HEURISTIC");

      // Cleanup
      await prisma.contents.delete({ where: { id: content.id } });
    });
  });

  describe("AC3: Narrative detection", () => {
    it("should detect NARRATIVE mode for ARTICLE with high dialogue", async () => {
      // Create ARTICLE with dialogue
      const content = await prisma.contents.create({
        data: {
          id: "test-narrative-" + Date.now(),
          type: "ARTICLE",
          title: "A Short Story",
          original_language: Language.PT_BR,
          raw_text:
            '"Olá," ela disse. "Como vai?" ele respondeu. "Tudo bem," ela continuou. Esta conversa tinha muito diálogo.',
        },
      });

      // Get mode
      const mode = await contentModeService.getMode(content.id);

      // Verify narrative detection
      expect(mode).toBe(ContentMode.NARRATIVE);

      // Cleanup
      await prisma.contents.delete({ where: { id: content.id } });
    });

    it("should default to TECHNICAL for ARTICLE without dialogue", async () => {
      // Create ARTICLE without dialogue
      const content = await prisma.contents.create({
        data: {
          id: "test-technical-" + Date.now(),
          type: "ARTICLE",
          title: "Technical Documentation",
          original_language: Language.EN,
          raw_text:
            "This article explains the technical implementation of a system. It contains no dialogue or narrative elements.",
        },
      });

      // Get mode
      const mode = await contentModeService.getMode(content.id);

      // Verify
      expect(mode).toBe(ContentMode.TECHNICAL);

      // Cleanup
      await prisma.contents.delete({ where: { id: content.id } });
    });
  });

  describe("AC4: Priority rules (PRODUCER > USER > HEURISTIC)", () => {
    it("should respect PRODUCER mode over inference", async () => {
      // Create NEWS content
      const content = await prisma.contents.create({
        data: {
          id: "test-priority-" + Date.now(),
          type: "NEWS",
          title: "News Article",
          original_language: Language.PT_BR,
          raw_text: "Notícia importante...",
        },
      });

      // Set PRODUCER mode (different from inferred NEWS)
      await contentModeService.setMode(
        content.id,
        ContentMode.DIDACTIC,
        "producer-123",
        "PRODUCER",
      );

      // Get mode
      const mode = await contentModeService.getMode(content.id);

      // Should return PRODUCER mode, not inferred NEWS
      expect(mode).toBe(ContentMode.DIDACTIC);

      // Cleanup
      await prisma.contents.delete({ where: { id: content.id } });
    });
  });

  describe("AC5: Idempotent persistence", () => {
    it("should not overwrite existing mode", async () => {
      // Create content with explicit mode
      const content = await prisma.contents.create({
        data: {
          id: "test-idempotent-" + Date.now(),
          type: "ARXIV",
          title: "Research Paper",
          original_language: Language.PT_BR,
          raw_text: "Abstract...",
          mode: "DIDACTIC", // Explicitly set (different from inferred SCIENTIFIC)
          mode_source: "USER",
          mode_set_by: "user-123",
          mode_set_at: new Date(),
        },
      });

      // Get mode (should NOT overwrite)
      const mode = await contentModeService.getMode(content.id);

      // Should return existing mode, not inferred
      expect(mode).toBe(ContentMode.DIDACTIC);

      // Verify DB unchanged
      const updated = await prisma.contents.findUnique({
        where: { id: content.id },
        select: { mode: true, mode_source: true, mode_set_by: true },
      });

      expect(updated.mode).toBe("DIDACTIC");
      expect(updated.mode_source).toBe("USER");
      expect(updated.mode_set_by).toBe("user-123");

      // Cleanup
      await prisma.contents.delete({ where: { id: content.id } });
    });
  });
});
