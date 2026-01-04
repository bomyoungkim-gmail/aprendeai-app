"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async () => {
    process.env.NODE_ENV = "test";
    process.env.JWT_SECRET = "test-jwt-secret-for-integration-tests";
    process.env.DATABASE_URL =
        process.env.DATABASE_URL ||
            "postgresql://postgres:postgres@127.0.0.1:5432/aprendeai_test";
    process.env.RABBITMQ_URL =
        process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
    process.env.REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
    process.env.AWS_REGION = "us-east-1";
    process.env.AWS_ACCESS_KEY_ID = "test";
    process.env.AWS_SECRET_ACCESS_KEY = "test";
    process.env.SES_FROM_ADDRESS = "test@example.com";
    process.env.AI_SERVICE_URL = "http://localhost:8001";
    console.log("[Test Setup] Environment configured for integration tests");
    console.log("[Test Setup] DATABASE_URL:", process.env.DATABASE_URL);
    console.log("[Test Setup] JWT_SECRET:", process.env.JWT_SECRET ? "✓ SET" : "✗ NOT SET");
};
//# sourceMappingURL=setup-integration.js.map