"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaEventRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let PrismaEventRepository = class PrismaEventRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async persist(event) {
        await this.prisma.session_events.create({
            data: {
                id: event.id,
                reading_session_id: event.sessionId,
                event_type: event.type,
                payload_json: event.payload,
                created_at: event.createdAt,
            },
        });
    }
    async getSessionEvents(sessionId, domain) {
        const where = { reading_session_id: sessionId };
        if (domain) {
            where.payload_json = {
                path: ['domain'],
                equals: domain,
            };
        }
        const events = await this.prisma.session_events.findMany({
            where,
            orderBy: { created_at: 'asc' },
        });
        return events.map(this.mapToEntity);
    }
    async getHouseholdEvents(householdId, limit = 100) {
        const events = await this.prisma.session_events.findMany({
            where: {
                payload_json: {
                    path: ['data', 'householdId'],
                    equals: householdId,
                },
            },
            orderBy: { created_at: 'desc' },
            take: limit,
        });
        return events.map(this.mapToEntity);
    }
    async getClassroomEvents(classroomId, limit = 100) {
        const events = await this.prisma.session_events.findMany({
            where: {
                payload_json: {
                    path: ['data', 'classroomId'],
                    equals: classroomId,
                },
            },
            orderBy: { created_at: 'desc' },
            take: limit,
        });
        return events.map(this.mapToEntity);
    }
    async getStudentEvents(learnerUserId, limit = 50) {
        const events = await this.prisma.session_events.findMany({
            where: {
                payload_json: {
                    path: ['data', 'learnerUserId'],
                    equals: learnerUserId,
                },
            },
            orderBy: { created_at: 'desc' },
            take: limit,
        });
        return events.map(this.mapToEntity);
    }
    mapToEntity(e) {
        return {
            id: e.id,
            type: e.event_type,
            sessionId: e.reading_session_id,
            payload: e.payload_json,
            createdAt: e.created_at,
        };
    }
};
exports.PrismaEventRepository = PrismaEventRepository;
exports.PrismaEventRepository = PrismaEventRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaEventRepository);
//# sourceMappingURL=prisma-event.repository.js.map