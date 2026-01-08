import { Test, TestingModule } from "@nestjs/testing";
import { GetContentUseCase } from "./get-content.use-case";
import { IContentRepository } from "../../domain/content.repository.interface";
import { ContentAccessService } from "../../services/content-access.service";
import { Content } from "../../domain/content.entity";
import { NotFoundException, ForbiddenException } from "@nestjs/common";

import { ContentType, ScopeType } from "@prisma/client";

describe("GetContentUseCase", () => {
  let useCase: GetContentUseCase;
  let repository: jest.Mocked<IContentRepository>;
  let accessService: jest.Mocked<ContentAccessService>;

  const mockContent = new Content({
    id: "content-1",
    title: "Test Content",
    type: ContentType.ARTICLE,
    scopeId: "user-1",
    scopeType: ScopeType.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetContentUseCase,
        {
          provide: IContentRepository,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: ContentAccessService,
          useValue: {
            canAccessContent: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<GetContentUseCase>(GetContentUseCase);
    repository = module.get(IContentRepository);
    accessService = module.get(ContentAccessService);
  });

  it("should return content if found and user has access", async () => {
    repository.findById.mockResolvedValue(mockContent);
    accessService.canAccessContent.mockResolvedValue(true);

    const result = await useCase.execute("content-1", "user-1");

    expect(result).toBe(mockContent);
    expect(repository.findById).toHaveBeenCalledWith("content-1");
    expect(accessService.canAccessContent).toHaveBeenCalledWith(
      "content-1",
      "user-1",
    );
  });

  it("should throw NotFoundException if content does not exist", async () => {
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute("content-1", "user-1")).rejects.toThrow(
      NotFoundException,
    );
    expect(repository.findById).toHaveBeenCalledWith("content-1");
    expect(accessService.canAccessContent).not.toHaveBeenCalled();
  });

  it("should throw ForbiddenException if user does not have access", async () => {
    repository.findById.mockResolvedValue(mockContent);
    accessService.canAccessContent.mockResolvedValue(false);

    await expect(useCase.execute("content-1", "user-2")).rejects.toThrow(
      ForbiddenException,
    );
    expect(accessService.canAccessContent).toHaveBeenCalledWith(
      "content-1",
      "user-2",
    );
  });
});
