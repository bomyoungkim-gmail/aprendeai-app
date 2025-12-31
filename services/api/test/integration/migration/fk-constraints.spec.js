"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const prisma_service_1 = require("../../../src/prisma/prisma.service");
const client_1 = require("@prisma/client");
const uuid_1 = require("uuid");
describe("Migration: FK Constraints (Subfase 5.1)", () => {
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
    describe("Institution Membership FKs", () => {
        it("should fail to create membership for non-existent institution", async () => {
            const user = await prisma.users.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    email: `test-fk-${(0, uuid_1.v4)()}@example.com`,
                    name: "Test FK User",
                    password_hash: "hash",
                    schooling_level: "Ensino Médio",
                    updated_at: new Date(),
                },
            });
            const invalidInstitutionId = (0, uuid_1.v4)();
            await expect(prisma.institution_members.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    user_id: user.id,
                    institution_id: invalidInstitutionId,
                    role: "STUDENT",
                },
            })).rejects.toThrow();
            await prisma.users.delete({ where: { id: user.id } });
        });
        it("should fail to create membership for non-existent user", async () => {
            const institution = await prisma.institutions.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    name: "Test FK Inst",
                    slug: `test-fk-${(0, uuid_1.v4)()}`,
                    type: client_1.InstitutionType.SCHOOL,
                    updated_at: new Date(),
                },
            });
            const invalidUserId = (0, uuid_1.v4)();
            await expect(prisma.institution_members.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    user_id: invalidUserId,
                    institution_id: institution.id,
                    role: "STUDENT",
                },
            })).rejects.toThrow();
            await prisma.institutions.delete({ where: { id: institution.id } });
        });
    });
    describe("Content Ownership FKs", () => {
        it("should fail to create content with invalid ownerId (if constraint exists)", async () => {
            const user = await prisma.users.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    email: `test-content-${(0, uuid_1.v4)()}@example.com`,
                    name: "Test Content User",
                    password_hash: "hash",
                    schooling_level: "Ensino Médio",
                    updated_at: new Date(),
                },
            });
            const content = await prisma.contents.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    title: "Test Content",
                    type: client_1.ContentType.ARTICLE,
                    owner_type: "USER",
                    owner_id: user.id,
                    owner_user_id: user.id,
                    raw_text: "Test content body",
                    original_language: client_1.Language.PT_BR,
                    updated_at: new Date(),
                },
            });
            expect(content).toBeDefined();
            expect(content.owner_type).toBe("USER");
            await prisma.contents.delete({ where: { id: content.id } });
            await prisma.users.delete({ where: { id: user.id } });
        });
    });
});
//# sourceMappingURL=fk-constraints.spec.js.map