import { Test, TestingModule } from "@nestjs/testing";
import { StartSessionUseCase } from "./start-session.use-case";
import { ISessionsRepository } from "../../domain/sessions.repository.interface";
import { ProfileService } from "../../../profiles/profile.service";
import { GatingService } from "../../../gating/gating.service";
import { IContentRepository } from "../../../cornell/domain/content.repository.interface";
import { ReadingSession } from "../../domain/reading-session.entity";
import { SessionPhase, SessionModality, AssetLayer } from "@prisma/client";
import { NotFoundException } from "@nestjs/common";

describe("StartSessionUseCase", () => {
  let useCase: StartSessionUseCase;
  let repository: jest.Mocked<ISessionsRepository>;
  let profileService: jest.Mocked<ProfileService>;
  let gatingService: jest.Mocked<GatingService>;
  let contentRepository: jest.Mocked<IContentRepository>;

  const mockSession = new ReadingSession({
    id: "session-1",
    userId: "user-1",
    contentId: "content-1",
    phase: SessionPhase.PRE,
    modality: SessionModality.READING,
    assetLayer: AssetLayer.L1,
    startTime: new Date(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StartSessionUseCase,
        {
          provide: ISessionsRepository,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: ProfileService,
          useValue: {
            getOrCreate: jest.fn(),
          },
        },
        {
          provide: GatingService,
          useValue: {
            determineLayer: jest.fn(),
          },
        },
        {
          provide: IContentRepository,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<StartSessionUseCase>(StartSessionUseCase);
    repository = module.get(ISessionsRepository);
    profileService = module.get(ProfileService);
    gatingService = module.get(GatingService);
    contentRepository = module.get(IContentRepository);
  });

  it("should start a session successfully", async () => {
    profileService.getOrCreate.mockResolvedValue({
      educationLimit: "MEDIO",
      educationLevel: "MEDIO",
    } as any);
    contentRepository.findById.mockResolvedValue({ id: "content-1" } as any);
    gatingService.determineLayer.mockResolvedValue(AssetLayer.L1);
    repository.create.mockResolvedValue(mockSession);

    const result = await useCase.execute("user-1", "content-1");

    expect(result.id).toBe("session-1");
    expect(result.minTargetWords).toBe(6); // MEDIO level
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        contentId: "content-1",
        phase: "PRE",
      }),
    );
  });

  it("should throw NotFoundException if content does not exist", async () => {
    profileService.getOrCreate.mockResolvedValue({
      educationLimit: "MEDIO",
    } as any);
    contentRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute("user-1", "content-999")).rejects.toThrow(
      NotFoundException,
    );
  });
});
