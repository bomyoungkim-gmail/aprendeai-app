import { Test, TestingModule } from "@nestjs/testing";
import { CreateContentUseCase } from "./create-content.use-case";
import { IContentRepository } from "../../domain/content.repository.interface";
import { StorageService } from "../../services/storage.service";
import { VideoService } from "../../../video/video.service";
import { Content } from "../../domain/content.entity";
import { UploadContentDto } from "../../dto/upload-content.dto";
import { ContentType, Language } from "@prisma/client";

describe("CreateContentUseCase", () => {
  let useCase: CreateContentUseCase;
  let repository: jest.Mocked<IContentRepository>;
  let storageService: jest.Mocked<StorageService>;
  let videoService: jest.Mocked<VideoService>;

  const mockDto: UploadContentDto = {
    title: "New Content",
    originalLanguage: Language.EN,
    scopeType: "USER",
  };

  const mockFile = {
    mimetype: "application/pdf",
    originalname: "test.pdf",
    buffer: Buffer.from("test"),
  } as Express.Multer.File;

  const mockContent = new Content({
    id: "content-1",
    title: "New Content",
    type: ContentType.PDF, // Use PDF as default fallback in UseCase
    ownerId: "user-1",
    ownerType: "USER",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateContentUseCase,
        {
          provide: IContentRepository,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: StorageService,
          useValue: {
            saveFile: jest.fn().mockResolvedValue("test-key"),
          },
        },
        {
          provide: VideoService,
          useValue: {
            isVideoFile: jest.fn().mockReturnValue(false),
            isAudioFile: jest.fn().mockReturnValue(false),
            extractVideoMetadata: jest.fn(),
            generateThumbnail: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<CreateContentUseCase>(CreateContentUseCase);
    repository = module.get(IContentRepository);
    storageService = module.get(StorageService);
    videoService = module.get(VideoService);
  });

  it("should create content successfully with file", async () => {
    repository.create.mockResolvedValue(mockContent);

    const result = await useCase.execute(mockFile, mockDto, "user-1");

    expect(result).toBe(mockContent);
    expect(storageService.saveFile).toHaveBeenCalledWith(mockFile);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "New Content",
        type: "PDF",
        ownerId: "user-1",
      }),
    );
  });
});
