"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestAuthHelper = void 0;
exports.createTestUser = createTestUser;
const jwt_1 = require("@nestjs/jwt");
class TestAuthHelper {
    constructor(jwtSecret) {
        this.jwtService = new jwt_1.JwtService({
            secret: jwtSecret,
            signOptions: { expiresIn: "1h" },
        });
    }
    generateToken(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            name: user.name,
            iat: Math.floor(Date.now() / 1000),
        };
        return this.jwtService.sign(payload);
    }
    generateAuthHeader(user) {
        const token = this.generateToken(user);
        return `Bearer ${token}`;
    }
    generateExpiredToken(user) {
        const jwtServiceExpired = new jwt_1.JwtService({
            secret: this.jwtService["options"].secret,
            signOptions: { expiresIn: "0s" },
        });
        const payload = {
            sub: user.id,
            email: user.email,
            name: user.name,
            iat: Math.floor(Date.now() / 1000) - 7200,
        };
        return jwtServiceExpired.sign(payload);
    }
    verifyToken(token) {
        return this.jwtService.verify(token);
    }
}
exports.TestAuthHelper = TestAuthHelper;
function createTestUser(overrides) {
    return {
        id: (overrides === null || overrides === void 0 ? void 0 : overrides.id) || "test-user-id-123",
        email: (overrides === null || overrides === void 0 ? void 0 : overrides.email) || "test@example.com",
        name: (overrides === null || overrides === void 0 ? void 0 : overrides.name) || "Test User",
    };
}
//# sourceMappingURL=auth.helper.js.map