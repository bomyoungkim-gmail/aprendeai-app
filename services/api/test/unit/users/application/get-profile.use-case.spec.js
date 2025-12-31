"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const get_profile_use_case_1 = require("../../../../src/users/application/get-profile.use-case");
const user_entity_1 = require("../../../../src/users/domain/user.entity");
const common_1 = require("@nestjs/common");
describe("GetProfileUseCase", () => {
    let useCase;
    let mockRepo;
    const mockUser = new user_entity_1.User({
        id: "1",
        email: "test@example.com",
        name: "Test User",
        systemRole: user_entity_1.UserSystemRole.USER,
        contextRole: user_entity_1.UserContextRole.STUDENT,
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
        useCase = new get_profile_use_case_1.GetProfileUseCase(mockRepo);
    });
    it("should return user dto when found", async () => {
        mockRepo.findById.mockResolvedValue(mockUser);
        const result = await useCase.execute("1");
        expect(result).toBeDefined();
        expect(result === null || result === void 0 ? void 0 : result.email).toBe("test@example.com");
    });
    it("should throw NotFoundException when user missing", async () => {
        mockRepo.findById.mockResolvedValue(null);
        await expect(useCase.execute("1")).rejects.toThrow(common_1.NotFoundException);
    });
});
//# sourceMappingURL=get-profile.use-case.spec.js.map