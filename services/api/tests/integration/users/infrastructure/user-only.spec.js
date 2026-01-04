"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_entity_1 = require("../../../../src/users/domain/user.entity");
describe("User Entity Load Test", () => {
    it("should load User class", () => {
        console.log("User class:", user_entity_1.User);
        expect(user_entity_1.User).toBeDefined();
    });
    it("should instantiate User", () => {
        try {
            const u = new user_entity_1.User({
                id: "1",
                email: "test@example.com",
                systemRole: "USER",
                contextRole: "STUDENT",
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            console.log("User instance:", u);
            expect(u).toBeDefined();
        }
        catch (e) {
            console.error("Instantiation failed:", e);
            throw e;
        }
    });
});
//# sourceMappingURL=user-only.spec.js.map