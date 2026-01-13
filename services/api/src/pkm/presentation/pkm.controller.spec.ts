import { Test, TestingModule } from "@nestjs/testing";
import { PkmController } from "../presentation/pkm.controller";
import { PkmGenerationService } from "../application/pkm-generation.service";
import { DecisionService } from "../../decision/application/decision.service";
import { IPkmNoteRepository } from "../domain/repositories/pkm-note.repository.interface";
import { ForbiddenException } from "@nestjs/common";

describe("PkmController", () => {
  let controller: PkmController;
  let pkmService: PkmGenerationService;
  let decisionPrisma: any;

  const mockPkmService = {
    generateFromSession: jest.fn(),
    confirmSave: jest.fn(),
  };

  const mockRepo = {
    findByUserId: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  // Mock DecisionService internals for private method test
  const mockDecisionPrisma = {
    reading_sessions: {
      findUnique: jest.fn(),
    },
  };

  const mockReq = { user: { userId: "user-1" } };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PkmController],
      providers: [
        {
          provide: PkmGenerationService,
          useValue: mockPkmService,
        },
        {
          provide: IPkmNoteRepository,
          useValue: mockRepo,
        },
        {
          // Mock DecisionService with internal prisma access for test
          provide: DecisionService,
          useValue: { prisma: mockDecisionPrisma },
        },
      ],
    }).compile();

    controller = module.get<PkmController>(PkmController);
    pkmService = module.get<PkmGenerationService>(PkmGenerationService);
    decisionPrisma = mockDecisionPrisma;
  });

  describe("generate", () => {
    it("should call service if phase is POST", async () => {
      mockDecisionPrisma.reading_sessions.findUnique.mockResolvedValue({
        phase: "POST",
      });
      mockPkmService.generateFromSession.mockResolvedValue({});

      await controller.generate({ sessionId: "s-1" }, mockReq);

      expect(mockPkmService.generateFromSession).toHaveBeenCalledWith(
        "user-1",
        "s-1",
      );
    });

    it("should throw ForbiddenException if phase is DURING", async () => {
      mockDecisionPrisma.reading_sessions.findUnique.mockResolvedValue({
        phase: "DURING",
      });

      await expect(
        controller.generate({ sessionId: "s-1" }, mockReq),
      ).rejects.toThrow(ForbiddenException);
    });

    it("should throw ForbiddenException if session not found", async () => {
      mockDecisionPrisma.reading_sessions.findUnique.mockResolvedValue(null);

      await expect(
        controller.generate({ sessionId: "s-1" }, mockReq),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("save", () => {
    it("should call service confirmSave", async () => {
      await controller.save("note-1", mockReq);
      expect(mockPkmService.confirmSave).toHaveBeenCalledWith(
        "note-1",
        "user-1",
      );
    });
  });
});
