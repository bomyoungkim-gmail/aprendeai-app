"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
console.log("Test file loaded");
const testing_1 = require("@nestjs/testing");
const prisma_service_1 = require("../../../../src/prisma/prisma.service");
const users_repository_1 = require("../../../../src/users/infrastructure/users.repository");
const user_entity_1 = require("../../../../src/users/domain/user.entity");
describe("UsersRepository (Integration)", () => {
    let repository;
    let prisma;
    beforeAll(async () => {
        const mockUsers = [];
        const moduleRef = await testing_1.Test.createTestingModule({
            providers: [
                users_repository_1.UsersRepository,
                {
                    provide: prisma_service_1.PrismaService,
                    useValue: {
                        users: {
                            create: jest.fn().mockImplementation((args) => {
                                const u = Object.assign({}, args.data);
                                mockUsers.push(u);
                                return u;
                            }),
                            findUnique: jest.fn().mockImplementation((args) => {
                                if (args.where.id)
                                    return mockUsers.find((u) => u.id === args.where.id) || null;
                                if (args.where.email)
                                    return (mockUsers.find((u) => u.email === args.where.email) || null);
                                return null;
                            }),
                        },
                    },
                },
            ],
        }).compile();
        repository = moduleRef.get(users_repository_1.UsersRepository);
    });
    it("should create and retrieve a user", async () => {
        const email = `test-${Date.now()}@example.com`;
        const user = await repository.create({
            id: `user-${Date.now()}`,
            email,
            name: "Integration User",
            system_role: user_entity_1.UserSystemRole.USER,
            last_context_role: user_entity_1.UserContextRole.STUDENT,
            created_at: new Date(),
            updated_at: new Date(),
        });
        expect(user).toBeDefined();
        expect(user.email).toBe(email);
        expect(user.name).toBe("Integration User");
        const found = await repository.findByEmail(email);
        expect(found).toBeDefined();
        expect(found === null || found === void 0 ? void 0 : found.id).toBe(user.id);
    });
});
//# sourceMappingURL=users.repository.spec.js.map