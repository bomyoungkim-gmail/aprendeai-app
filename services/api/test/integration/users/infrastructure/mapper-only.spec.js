"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_mapper_1 = require("../../../../src/users/infrastructure/user.mapper");
const user_entity_1 = require("../../../../src/users/domain/user.entity");
describe("UserMapper Load Test", () => {
    it("should load UserMapper class", () => {
        console.log("UserMapper class:", user_mapper_1.UserMapper);
        expect(user_mapper_1.UserMapper).toBeDefined();
    });
    it("should call toDomain", () => {
        const raw = {
            id: "1",
            email: "test@example.com",
            system_role: "USER",
            last_context_role: "STUDENT",
            created_at: new Date(),
            updated_at: new Date(),
        };
        const u = user_mapper_1.UserMapper.toDomain(raw);
        console.log("Mapped User:", u);
        expect(u).toBeInstanceOf(user_entity_1.User);
    });
});
//# sourceMappingURL=mapper-only.spec.js.map