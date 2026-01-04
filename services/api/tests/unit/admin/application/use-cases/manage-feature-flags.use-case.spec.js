"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const manage_feature_flags_use_case_1 = require("../../../../../src/admin/application/use-cases/manage-feature-flags.use-case");
const admin_repository_interface_1 = require("../../../../../src/admin/domain/admin.repository.interface");
describe("ManageFeatureFlagsUseCase", () => {
    let useCase;
    const mockFlagsRepo = {
        create: jest.fn(),
        update: jest.fn(),
        findById: jest.fn(),
        findByKey: jest.fn(),
        findMany: jest.fn(),
    };
    const mockAuditRepo = {
        create: jest.fn(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                manage_feature_flags_use_case_1.ManageFeatureFlagsUseCase,
                { provide: admin_repository_interface_1.IFeatureFlagsRepository, useValue: mockFlagsRepo },
                { provide: admin_repository_interface_1.IAuditLogsRepository, useValue: mockAuditRepo },
            ],
        }).compile();
        useCase = module.get(manage_feature_flags_use_case_1.ManageFeatureFlagsUseCase);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe("create", () => {
        it("should create a flag and audit log", async () => {
            mockFlagsRepo.findByKey.mockResolvedValue(null);
            const flagData = { id: "1", key: "new-feature", name: "New Feature", enabled: true, createdBy: "admin" };
            mockFlagsRepo.create.mockResolvedValue(flagData);
            const result = await useCase.create({ key: "new-feature", name: "New Feature", enabled: true }, { userId: "admin", role: "ADMIN" });
            expect(mockFlagsRepo.create).toHaveBeenCalled();
            expect(mockAuditRepo.create).toHaveBeenCalledWith(expect.objectContaining({
                action: "FEATURE_FLAG_CREATED",
                resourceId: "1"
            }));
            expect(result).toEqual(flagData);
        });
        it("should throw if key exists", async () => {
            mockFlagsRepo.findByKey.mockResolvedValue({ id: "1" });
            await expect(useCase.create({ key: "existing", name: "Ex", enabled: true }, { userId: "admin", role: "ADMIN" })).rejects.toThrow();
        });
    });
    describe("toggle", () => {
        it("should toggle flag and audit", async () => {
            mockFlagsRepo.findById.mockResolvedValue({ id: "1", enabled: true });
            mockFlagsRepo.update.mockResolvedValue({ id: "1", enabled: false });
            await useCase.toggle("1", false, "reason", { userId: "admin", role: "ADMIN" });
            expect(mockFlagsRepo.update).toHaveBeenCalledWith("1", { enabled: false });
            expect(mockAuditRepo.create).toHaveBeenCalledWith(expect.objectContaining({
                action: "FEATURE_FLAG_TOGGLED",
                afterJson: { enabled: false }
            }));
        });
    });
});
//# sourceMappingURL=manage-feature-flags.use-case.spec.js.map