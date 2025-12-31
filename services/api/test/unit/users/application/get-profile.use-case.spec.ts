import { GetProfileUseCase } from "../../../../src/users/application/get-profile.use-case";
import { IUsersRepository } from "../../../../src/users/domain/users.repository.interface";
import {
  User,
  UserSystemRole,
  UserContextRole,
} from "../../../../src/users/domain/user.entity";
import { NotFoundException } from "@nestjs/common";

describe("GetProfileUseCase", () => {
  let useCase: GetProfileUseCase;
  let mockRepo: jest.Mocked<IUsersRepository>;

  const mockUser = new User({
    id: "1",
    email: "test@example.com",
    name: "Test User",
    systemRole: UserSystemRole.USER,
    contextRole: UserContextRole.STUDENT,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateSettings: jest.fn(),
      countUsersByDomain: jest.fn(),
    };
    useCase = new GetProfileUseCase(mockRepo);
  });

  it("should return user dto when found", async () => {
    mockRepo.findById.mockResolvedValue(mockUser);
    const result = await useCase.execute("1");
    expect(result).toBeDefined();
    expect(result?.email).toBe("test@example.com");
  });

  it("should throw NotFoundException when user missing", async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute("1")).rejects.toThrow(NotFoundException);
  });
});
