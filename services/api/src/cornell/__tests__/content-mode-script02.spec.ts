import { Test, TestingModule } from "@nestjs/testing";
import { ContentModeService } from "../content-mode.service";
import { PrismaService } from "../../prisma/prisma.service";
import { ContentMode } from "@prisma/client";

/**
 * Additional unit tests for Script 02 enhancements
 * Tests ContentType-based inference and narrative detection
 */
describe("ContentModeService - Script 02 Enhancements", () => {
  let service: ContentModeService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    contents: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentModeService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ContentModeService>(ContentModeService);
    prismaService = module.get(PrismaService);

    jest.clearAllMocks();
  });

  describe("ContentType-based inference (P3.1)", () => {
    const contentTypeCases = [
      { type: "NEWS", expected: ContentMode.NEWS },
      { type: "ARXIV", expected: ContentMode.SCIENTIFIC },
      { type: "SCHOOL_MATERIAL", expected: ContentMode.DIDACTIC },
      { type: "VIDEO", expected: ContentMode.TECHNICAL },
      { type: "AUDIO", expected: ContentMode.TECHNICAL },
    ];

    contentTypeCases.forEach(({ type, expected }) => {
      it(`should infer ${expected} for ContentType: ${type}`, async () => {
        const mockContent = {
          mode: null,
          mode_source: null,
          title: "Generic Title",
          type,
          raw_text: "Some content",
        };
        mockPrismaService.contents.findUnique.mockResolvedValue(
          mockContent as any,
        );
        mockPrismaService.contents.update.mockResolvedValue({} as any);

        const result = await service.getMode("content-123");

        expect(result).toBe(expected);
      });
    });
  });

  describe("Narrative detection heuristic (P3.2)", () => {
    it("should detect narrative in ARTICLE with high dialogue ratio", async () => {
      const mockContent = {
        mode: null,
        mode_source: null,
        title: "A Story",
        type: "ARTICLE",
        raw_text:
          '"Hello," she said. "How are you?" he replied. "I am fine," she answered. This went on for a while with lots of dialogue.',
      };
      mockPrismaService.contents.findUnique.mockResolvedValue(
        mockContent as any,
      );
      mockPrismaService.contents.update.mockResolvedValue({} as any);

      const result = await service.getMode("content-123");

      expect(result).toBe(ContentMode.NARRATIVE);
    });

    it("should default to TECHNICAL for ARTICLE without dialogue", async () => {
      const mockContent = {
        mode: null,
        mode_source: null,
        title: "Technical Article",
        type: "ARTICLE",
        raw_text:
          "This is a technical article about programming. It explains concepts in detail without any dialogue or narrative elements.",
      };
      mockPrismaService.contents.findUnique.mockResolvedValue(
        mockContent as any,
      );
      mockPrismaService.contents.update.mockResolvedValue({} as any);

      const result = await service.getMode("content-123");

      expect(result).toBe(ContentMode.TECHNICAL);
    });

    it("should detect narrative in TEXT with dialogue", async () => {
      const mockContent = {
        mode: null,
        mode_source: null,
        title: "Fiction Text",
        type: "TEXT",
        raw_text:
          '"Once upon a time," the narrator began, "there was a kingdom." "Tell me more!" the child exclaimed.',
      };
      mockPrismaService.contents.findUnique.mockResolvedValue(
        mockContent as any,
      );
      mockPrismaService.contents.update.mockResolvedValue({} as any);

      const result = await service.getMode("content-123");

      expect(result).toBe(ContentMode.NARRATIVE);
    });

    it("should default to TECHNICAL for WEB_CLIP without dialogue", async () => {
      const mockContent = {
        mode: null,
        mode_source: null,
        title: "Blog Post",
        type: "WEB_CLIP",
        raw_text:
          "This blog post discusses best practices for software development. It covers topics like testing, documentation, and code review.",
      };
      mockPrismaService.contents.findUnique.mockResolvedValue(
        mockContent as any,
      );
      mockPrismaService.contents.update.mockResolvedValue({} as any);

      const result = await service.getMode("content-123");

      expect(result).toBe(ContentMode.TECHNICAL);
    });
  });

  describe("Lazy persistence (P3 persistence)", () => {
    it("should persist inferred mode to database with HEURISTIC source", async () => {
      const mockContent = {
        mode: null,
        mode_source: null,
        title: "News Article",
        type: "NEWS",
        raw_text: "Breaking news content",
      };
      mockPrismaService.contents.findUnique.mockResolvedValue(
        mockContent as any,
      );
      mockPrismaService.contents.update.mockResolvedValue({} as any);

      await service.getMode("content-123");

      expect(prismaService.contents.update).toHaveBeenCalledWith({
        where: { id: "content-123" },
        data: {
          mode: ContentMode.NEWS,
          mode_source: "HEURISTIC",
          mode_set_by: "SYSTEM",
          mode_set_at: expect.any(Date),
        },
      });
    });

    it("should NOT persist if mode already exists (idempotent)", async () => {
      const mockContent = {
        mode: ContentMode.DIDACTIC,
        mode_source: "USER",
        title: "Course Material",
        type: "SCHOOL_MATERIAL",
        raw_text: "Educational content",
      };
      mockPrismaService.contents.findUnique.mockResolvedValue(
        mockContent as any,
      );

      await service.getMode("content-123");

      expect(prismaService.contents.update).not.toHaveBeenCalled();
    });

    it("should persist SCIENTIFIC mode for ARXIV content", async () => {
      const mockContent = {
        mode: null,
        mode_source: null,
        title: "Research Paper on Machine Learning",
        type: "ARXIV",
        raw_text: "Abstract: This paper presents...",
      };
      mockPrismaService.contents.findUnique.mockResolvedValue(
        mockContent as any,
      );
      mockPrismaService.contents.update.mockResolvedValue({} as any);

      const result = await service.getMode("content-123");

      expect(result).toBe(ContentMode.SCIENTIFIC);
      expect(prismaService.contents.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            mode: ContentMode.SCIENTIFIC,
            mode_source: "HEURISTIC",
            mode_set_by: "SYSTEM",
          }),
        }),
      );
    });
  });

  describe("Priority rules (P1 > P2 > P3)", () => {
    it("should respect PRODUCER mode over inference", async () => {
      const mockContent = {
        mode: ContentMode.DIDACTIC,
        mode_source: "PRODUCER",
        title: "News Article", // Would infer NEWS
        type: "NEWS",
        raw_text: "Content",
      };
      mockPrismaService.contents.findUnique.mockResolvedValue(
        mockContent as any,
      );

      const result = await service.getMode("content-123");

      expect(result).toBe(ContentMode.DIDACTIC); // PRODUCER wins
      expect(prismaService.contents.update).not.toHaveBeenCalled();
    });

    it("should respect USER mode over inference", async () => {
      const mockContent = {
        mode: ContentMode.NARRATIVE,
        mode_source: "USER",
        title: "Technical Manual", // Would infer TECHNICAL
        type: "ARTICLE",
        raw_text: "Technical content without dialogue",
      };
      mockPrismaService.contents.findUnique.mockResolvedValue(
        mockContent as any,
      );

      const result = await service.getMode("content-123");

      expect(result).toBe(ContentMode.NARRATIVE); // USER wins
      expect(prismaService.contents.update).not.toHaveBeenCalled();
    });
  });
});
