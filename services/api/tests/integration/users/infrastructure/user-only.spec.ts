import { User } from "../../../../src/users/domain/user.entity";

describe("User Entity Load Test", () => {
  it("should load User class", () => {
    console.log("User class:", User);
    expect(User).toBeDefined();
  });

  it("should instantiate User", () => {
    try {
      const u = new User({
        id: "1",
        email: "test@example.com",
        systemRole: "USER" as any,
        contextRole: "STUDENT" as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log("User instance:", u);
      expect(u).toBeDefined();
    } catch (e) {
      console.error("Instantiation failed:", e);
      throw e;
    }
  });
});
