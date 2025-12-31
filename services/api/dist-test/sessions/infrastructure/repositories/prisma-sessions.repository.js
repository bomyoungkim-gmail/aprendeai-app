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
exports.PrismaSessionsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const reading_session_entity_1 = require("../../domain/reading-session.entity");
const uuid_1 = require("uuid");
let PrismaSessionsRepository = class PrismaSessionsRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        const created = await this.prisma.reading_sessions.create({
            data: {
                id: data.id || (0, uuid_1.v4)(),
                user_id: data.userId,
                content_id: data.contentId,
                phase: data.phase || "PRE",
                modality: data.modality || "READING",
                asset_layer: data.assetLayer,
                target_words_json: data.targetWordsJson,
                content_version_id: data.contentVersionId,
                started_at: data.startTime || new Date(),
            },
            include: { contents: true },
        });
        return this.mapToDomain(created);
    }
    async findById(id) {
        const found = await this.prisma.reading_sessions.findUnique({
            where: { id },
            include: {
                contents: { select: { id: true, title: true, type: true, original_language: true } },
                session_events: { orderBy: { created_at: "asc" } }
            },
        });
        return found ? this.mapToDomain(found) : null;
    }
    async update(id, data) {
        const updated = await this.prisma.reading_sessions.update({
            where: { id },
            data: {
                phase: data.phase,
                finished_at: data.finishedAt,
                goal_statement: data.goalStatement,
                prediction_text: data.predictionText,
                target_words_json: data.targetWordsJson,
            },
            include: { contents: true },
        });
        return this.mapToDomain(updated);
    }
    async addEvent(sessionId, event) {
        var _a;
        const created = await this.prisma.session_events.create({
            data: {
                id: (0, uuid_1.v4)(),
                reading_session_id: sessionId,
                event_type: event.eventType,
                payload_json: (_a = event.payload) !== null && _a !== void 0 ? _a : {},
            }
        });
        return {
            id: created.id,
            sessionId: created.reading_session_id,
            eventType: created.event_type,
            payload: created.payload_json,
            createdAt: created.created_at
        };
    }
    async findEvents(sessionId) {
        const events = await this.prisma.session_events.findMany({
            where: { reading_session_id: sessionId },
            orderBy: { created_at: 'asc' }
        });
        return events.map(e => ({
            id: e.id,
            sessionId: e.reading_session_id,
            eventType: e.event_type,
            payload: e.payload_json,
            createdAt: e.created_at
        }));
    }
    async findMany(params) {
        const found = await this.prisma.reading_sessions.findMany(Object.assign(Object.assign({}, params), { include: { contents: { select: { id: true, title: true, type: true, original_language: true } } } }));
        return found.map(this.mapToDomain);
    }
    async count(params) {
        return this.prisma.reading_sessions.count(params);
    }
    async findReadContentIds(userId) {
        const found = await this.prisma.reading_sessions.findMany({
            where: { user_id: userId },
            select: { content_id: true },
            distinct: ['content_id'],
        });
        return found.map(f => f.content_id);
    }
    mapToDomain(prismaSession) {
        var _a;
        return new reading_session_entity_1.ReadingSession({
            id: prismaSession.id,
            userId: prismaSession.user_id,
            contentId: prismaSession.content_id,
            contentVersionId: prismaSession.content_version_id,
            phase: prismaSession.phase,
            modality: prismaSession.modality,
            assetLayer: prismaSession.asset_layer,
            startTime: prismaSession.started_at,
            finishedAt: prismaSession.finished_at,
            goalStatement: prismaSession.goal_statement,
            predictionText: prismaSession.prediction_text,
            targetWordsJson: prismaSession.target_words_json,
            createdAt: prismaSession.created_at,
            updatedAt: prismaSession.updated_at,
            content: prismaSession.contents ? {
                id: prismaSession.contents.id,
                title: prismaSession.contents.title,
                type: prismaSession.contents.type,
                originalLanguage: prismaSession.contents.original_language,
            } : undefined,
            events: (_a = prismaSession.session_events) === null || _a === void 0 ? void 0 : _a.map((e) => ({
                id: e.id,
                sessionId: e.reading_session_id,
                eventType: e.event_type,
                payload: e.payload_json,
                createdAt: e.created_at
            }))
        });
    }
};
exports.PrismaSessionsRepository = PrismaSessionsRepository;
exports.PrismaSessionsRepository = PrismaSessionsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaSessionsRepository);
//# sourceMappingURL=prisma-sessions.repository.js.map