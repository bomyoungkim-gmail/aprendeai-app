"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const prisma_service_1 = require("../../../src/prisma/prisma.service");
const uuid_1 = require("uuid");
const client_1 = require("@prisma/client");
describe("Migration: Scope & Ownership Mapping (Subfase 5.1)", () => {
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
    describe("Legacy User Role Mapping", () => {
        it("should verify legacy ADMIN mapping in DB", async () => {
            const admin = await prisma.users.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    email: `legacy-admin-${(0, uuid_1.v4)()}@example.com`,
                    name: "Legacy Admin",
                    password_hash: "hash",
                    system_role: client_1.SystemRole.ADMIN,
                    schooling_level: "Ensino Médio",
                    updated_at: new Date(),
                },
            });
            expect(admin.system_role).toBe("ADMIN");
            await prisma.users.delete({ where: { id: admin.id } });
        });
    });
    describe("Legacy Content Ownership", () => {
        it("should verify content creation with legacy owner_user_id", async () => {
            const user = await prisma.users.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    email: `legacy-content-user-${(0, uuid_1.v4)()}@example.com`,
                    name: "Legacy Content User",
                    password_hash: "hash",
                    schooling_level: "Superior",
                    updated_at: new Date(),
                },
            });
            const content = await prisma.contents.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    title: "Legacy Content",
                    type: client_1.ContentType.ARTICLE,
                    owner_user_id: user.id,
                    raw_text: "Legacy content body",
                    original_language: client_1.Language.PT_BR,
                    updated_at: new Date(),
                },
            });
            const retrieved = await prisma.contents.findUnique({
                where: { id: content.id },
            });
            expect(retrieved).toBeDefined();
            expect(retrieved === null || retrieved === void 0 ? void 0 : retrieved.owner_user_id).toBe(user.id);
            expect(retrieved === null || retrieved === void 0 ? void 0 : retrieved.owner_type).toBe(null);
            await prisma.contents.delete({ where: { id: content.id } });
            await prisma.users.delete({ where: { id: user.id } });
        });
    });
});
//# sourceMappingURL=scope-mapping.spec.js.map