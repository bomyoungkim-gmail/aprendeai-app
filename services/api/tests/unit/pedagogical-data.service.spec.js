"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const content_pedagogical_service_1 = require("../../src/cornell/services/content-pedagogical.service");
const prisma_service_1 = require("../../src/prisma/prisma.service");
describe("ContentPedagogicalService", () => {
    let service;
    const mockPrismaService = {
        content_pedagogical_data: {
            upsert: jest.fn(),
            findUnique: jest.fn(),
        },
        game_results: {
            create: jest.fn(),
        },
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                content_pedagogical_service_1.ContentPedagogicalService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
            ],
        }).compile();
        service = module.get(content_pedagogical_service_1.ContentPedagogicalService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    it("should be defined", () => {
        expect(service).toBeDefined();
    });
    describe("createOrUpdatePedagogicalData", () => {
        it("should upsert pedagogical data", async () => {
            const contentId = "content-123";
            const inputData = {
                vocabulary_triage: { words: [] },
            };
            await service.createOrUpdatePedagogicalData(contentId, inputData);
            expect(mockPrismaService.content_pedagogical_data.upsert).toHaveBeenCalledWith({
                where: { content_id: contentId },
                create: expect.objectContaining(Object.assign(Object.assign({}, inputData), { content_id: contentId })),
                update: expect.objectContaining(Object.assign({}, inputData)),
            });
        });
    });
    describe("recordGameResult", () => {
        it("should create a game result", async () => {
            const gameData = {
                game_type: "QUIZ",
                score: 100,
                user_id: "user-123",
                content_id: "content-123",
            };
            await service.recordGameResult(gameData);
            expect(mockPrismaService.game_results.create).toHaveBeenCalledWith({
                data: gameData,
            });
        });
    });
});
//# sourceMappingURL=pedagogical-data.service.spec.js.map