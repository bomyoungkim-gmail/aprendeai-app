import { UserMapper } from "../../../../src/users/infrastructure/user.mapper";
import { User } from "../../../../src/users/domain/user.entity";

describe("UserMapper Load Test", () => {
  it("should load UserMapper class", () => {
    console.log("UserMapper class:", UserMapper);
    expect(UserMapper).toBeDefined();
  });

  it("should call toDomain", () => {
    const raw = {
      id: "1",
      email: "test@example.com",
      system_role: "USER",
      last_context_role: "STUDENT",
      created_at: new Date(),
      updated_at: new Date(),
    } as any;

    // try {
    const u = UserMapper.toDomain(raw);
    console.log("Mapped User:", u);
    expect(u).toBeInstanceOf(User);
    // } catch (e) {
    //   console.error('Mapper failed:', e);
    //   throw e;
    // }
  });
});
