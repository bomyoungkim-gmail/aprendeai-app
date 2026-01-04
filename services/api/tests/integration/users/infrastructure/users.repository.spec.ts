console.log("Test file loaded");
import { Test } from "@nestjs/testing";
import { PrismaService } from "../../../../src/prisma/prisma.service";
import { UsersRepository } from "../../../../src/users/infrastructure/users.repository";
import {
  UserSystemRole,
  UserContextRole,
} from "../../../../src/users/domain/user.entity";

describe("UsersRepository (Integration)", () => {
  let repository: UsersRepository;
  let prisma: PrismaService;

  beforeAll(async () => {
    const mockUsers: any[] = [];
    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersRepository,
        {
          provide: PrismaService,
          useValue: {
            users: {
              create: jest.fn().mockImplementation((args) => {
                const u = { ...args.data };
                mockUsers.push(u);
                return u;
              }),
              findUnique: jest.fn().mockImplementation((args) => {
                if (args.where.id)
                  return mockUsers.find((u) => u.id === args.where.id) || null;
                if (args.where.email)
                  return (
                    mockUsers.find((u) => u.email === args.where.email) || null
                  );
                return null;
              }),
            },
          },
        },
      ],
    }).compile();

    repository = moduleRef.get<UsersRepository>(UsersRepository);
  });

  it("should create and retrieve a user", async () => {
    const email = `test-${Date.now()}@example.com`;
    const user = await repository.create({
      id: `user-${Date.now()}`,
      email,
      name: "Integration User",
      system_role: UserSystemRole.USER,
      last_context_role: UserContextRole.STUDENT,
      created_at: new Date(),
      updated_at: new Date(),
    });

    expect(user).toBeDefined();
    expect(user.email).toBe(email);
    expect(user.name).toBe("Integration User");

    const found = await repository.findByEmail(email);
    expect(found).toBeDefined();
    expect(found?.id).toBe(user.id);
  });
});
