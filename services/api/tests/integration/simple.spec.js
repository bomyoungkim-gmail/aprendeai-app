"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const prisma_service_1 = require("../../src/prisma/prisma.service");
describe("Simple Integration Test", () => {
    let prisma;
    let module;
    beforeAll(async () => {
        module = await testing_1.Test.createTestingModule({
            providers: [prisma_service_1.PrismaService],
        }).compile();
        prisma = module.get(prisma_service_1.PrismaService);
    });
    afterAll(async () => {
        await module.close();
    });
    it("should be defined", () => {
        expect(prisma).toBeDefined();
    });
});
//# sourceMappingURL=simple.spec.js.map