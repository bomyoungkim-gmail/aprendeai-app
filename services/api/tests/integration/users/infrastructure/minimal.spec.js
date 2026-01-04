"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const users_repository_1 = require("../../../../src/users/infrastructure/users.repository");
describe("Minimal Integration Test", () => {
    let repository;
    class FakeUser {
        constructor(props) {
            this.id = props.id;
        }
    }
    beforeAll(async () => {
        console.log("Test setup started");
        repository = new users_repository_1.UsersRepository({
            users: { findUnique: jest.fn() },
        });
        console.log("Manually instantiated repository");
    });
    it("should pass", () => {
        console.log("Minimal test running");
        expect(repository).toBeDefined();
    });
});
//# sourceMappingURL=minimal.spec.js.map