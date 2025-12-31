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
var GroupRoundsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupRoundsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const group_sessions_service_1 = require("./group-sessions.service");
const study_groups_ws_gateway_1 = require("../websocket/study-groups-ws.gateway");
const events_1 = require("../websocket/events");
const crypto = require("crypto");
let GroupRoundsService = GroupRoundsService_1 = class GroupRoundsService {
    constructor(prisma, groupSessionsService, wsGateway) {
        this.prisma = prisma;
        this.groupSessionsService = groupSessionsService;
        this.wsGateway = wsGateway;
        this.logger = new common_1.Logger(GroupRoundsService_1.name);
    }
    async updatePrompt(sessionId, roundIndex, user_id, dto) {
        const session = await this.groupSessionsService.getSession(sessionId, user_id);
        this.assertFacilitatorPermission(session, user_id);
        const round = await this.prisma.group_rounds.findFirst({
            where: { session_id: sessionId, round_index: roundIndex },
        });
        if (!round) {
            throw new common_1.BadRequestException("Round not found");
        }
        const updatedRound = await this.prisma.group_rounds.update({
            where: { id: round.id },
            data: {
                prompt_json: {
                    prompt_text: dto.prompt_text,
                    options: dto.options || null,
                    linked_highlight_ids: dto.linked_highlight_ids || [],
                },
            },
        });
        this.wsGateway.emitToSession(sessionId, events_1.StudyGroupEvent.PROMPT_UPDATED, {
            sessionId,
            roundId: round.id,
            roundIndex,
            prompt: dto.prompt_text,
        });
        return updatedRound;
    }
    async advanceRound(sessionId, roundIndex, user_id, toStatus) {
        const session = await this.groupSessionsService.getSession(sessionId, user_id);
        this.assertFacilitatorPermission(session, user_id);
        const round = await this.prisma.group_rounds.findFirst({
            where: { session_id: sessionId, round_index: roundIndex },
        });
        if (!round) {
            throw new common_1.BadRequestException("Round not found");
        }
        await this.validateTransition(sessionId, round.id, toStatus);
        const updatedRound = await this.prisma.group_rounds.update({
            where: { id: round.id },
            data: { status: toStatus },
        });
        this.wsGateway.emitToSession(sessionId, events_1.StudyGroupEvent.ROUND_ADVANCED, {
            sessionId,
            roundId: round.id,
            roundIndex,
            status: toStatus,
        });
        this.logger.log(`Round ${roundIndex} advanced to ${toStatus} in session ${sessionId}`);
        return updatedRound;
    }
    async submitEvent(sessionId, user_id, dto) {
        const session = await this.groupSessionsService.getSession(sessionId, user_id);
        const member = session.group_session_members.find((m) => m.user_id === user_id);
        if (!member || member.attendance_status !== "JOINED") {
            throw new common_1.ForbiddenException("Must be a joined session member");
        }
        const round = await this.prisma.group_rounds.findFirst({
            where: { session_id: sessionId, round_index: dto.round_index },
        });
        if (!round) {
            throw new common_1.BadRequestException("Round not found");
        }
        if (dto.event_type === "GROUP_EXPLANATION_SUBMIT") {
            if (member.assigned_role !== "SCRIBE") {
                throw new common_1.ForbiddenException("Only SCRIBE can submit group explanation");
            }
        }
        const event = await this.prisma.group_events.create({
            data: {
                id: crypto.randomUUID(),
                session_id: sessionId,
                round_id: round.id,
                user_id,
                event_type: dto.event_type,
                payload_json: dto.payload,
            },
        });
        const wsEventType = dto.event_type === "PI_VOTE_SUBMIT"
            ? events_1.StudyGroupEvent.VOTE_SUBMITTED
            : dto.event_type === "PI_REVOTE_SUBMIT"
                ? events_1.StudyGroupEvent.REVOTE_SUBMITTED
                : events_1.StudyGroupEvent.SESSION_UPDATED;
        this.wsGateway.emitToSession(sessionId, wsEventType, {
            sessionId,
            roundId: round.id,
            roundIndex: dto.round_index,
            user_id,
            eventType: dto.event_type,
        });
        if (dto.event_type === "GROUP_EXPLANATION_SUBMIT") {
            await this.createSharedCard(sessionId, round.id, user_id, dto.payload);
            this.wsGateway.emitToSession(sessionId, events_1.StudyGroupEvent.SHARED_CARD_CREATED, {
                sessionId,
                roundId: round.id,
                roundIndex: dto.round_index,
            });
        }
        this.logger.log(`Event ${dto.event_type} submitted for round ${round.id} by user ${user_id}`);
        return event;
    }
    async getEvents(sessionId, roundIndex) {
        const where = { session_id: sessionId };
        if (roundIndex !== undefined) {
            const round = await this.prisma.group_rounds.findFirst({
                where: { session_id: sessionId, round_index: roundIndex },
            });
            if (round) {
                where.round_id = round.id;
            }
        }
        return this.prisma.group_events.findMany({
            where,
            orderBy: { created_at: "asc" },
            include: {
                group_rounds: {
                    select: { round_index: true },
                },
            },
        });
    }
    async getSharedCards(sessionId) {
        return this.prisma.shared_cards.findMany({
            where: { session_id: sessionId },
            include: {
                group_rounds: {
                    select: { round_index: true, status: true },
                },
            },
            orderBy: { created_at: "asc" },
        });
    }
    async validateTransition(sessionId, roundId, toStatus) {
        switch (toStatus) {
            case "DISCUSSING":
                await this.assertAllVoted(sessionId, roundId, "PI_VOTE_SUBMIT");
                break;
            case "EXPLAINING":
                await this.assertAllVoted(sessionId, roundId, "PI_REVOTE_SUBMIT");
                break;
            case "DONE":
                await this.assertExplanationPresent(roundId);
                break;
        }
    }
    async assertAllVoted(sessionId, roundId, eventType) {
        const joinedCount = await this.prisma.group_session_members.count({
            where: { session_id: sessionId, attendance_status: "JOINED" },
        });
        const votes = await this.prisma.group_events.groupBy({
            by: ["user_id"],
            where: { round_id: roundId, event_type: eventType },
        });
        const votedCount = votes.length;
        if (votedCount < joinedCount) {
            const missing = joinedCount - votedCount;
            this.logger.warn(`Cannot advance: ${missing} members haven't ${eventType}`);
            throw new common_1.ConflictException({
                statusCode: 409,
                message: `Cannot advance: ${missing} member(s) haven't ${eventType}`,
                required: joinedCount,
                current: votedCount,
                missing,
            });
        }
    }
    async assertExplanationPresent(roundId) {
        const explanation = await this.prisma.group_events.findFirst({
            where: { round_id: roundId, event_type: "GROUP_EXPLANATION_SUBMIT" },
        });
        if (!explanation) {
            throw new common_1.ConflictException({
                statusCode: 409,
                message: "SCRIBE must submit group explanation before advancing to DONE",
            });
        }
    }
    async createSharedCard(sessionId, roundId, userId, payload) {
        const existing = await this.prisma.shared_cards.findUnique({
            where: { round_id: roundId },
        });
        if (existing) {
            return this.prisma.shared_cards.update({
                where: { round_id: roundId },
                data: {
                    card_json: {
                        prompt: payload.prompt || existing.card_json["prompt"],
                        groupAnswer: payload.group_choice || payload.groupAnswer,
                        explanation: payload.explanation,
                        linkedHighlightIds: payload.linked_highlight_ids || [],
                        keyTerms: payload.key_terms || [],
                    },
                },
            });
        }
        return this.prisma.shared_cards.create({
            data: {
                id: crypto.randomUUID(),
                session_id: sessionId,
                round_id: roundId,
                created_by_user_id: userId,
                card_json: {
                    prompt: payload.prompt || "",
                    groupAnswer: payload.group_choice || payload.groupAnswer,
                    explanation: payload.explanation,
                    linkedHighlightIds: payload.linked_highlight_ids || [],
                    keyTerms: payload.key_terms || [],
                },
            },
        });
    }
    assertFacilitatorPermission(session, user_id) {
        var _a, _b, _c;
        const sessionMember = (_a = session.group_session_members) === null || _a === void 0 ? void 0 : _a.find((m) => m.user_id === user_id);
        const groupMember = (_c = (_b = session.study_groups) === null || _b === void 0 ? void 0 : _b.study_group_members) === null || _c === void 0 ? void 0 : _c.find((m) => m.user_id === user_id);
        const canPerform = (sessionMember === null || sessionMember === void 0 ? void 0 : sessionMember.assigned_role) === "FACILITATOR" ||
            ["OWNER", "MOD"].includes(groupMember === null || groupMember === void 0 ? void 0 : groupMember.role);
        if (!canPerform) {
            throw new common_1.ForbiddenException("Only FACILITATOR or group OWNER/MOD can perform this action");
        }
    }
};
exports.GroupRoundsService = GroupRoundsService;
exports.GroupRoundsService = GroupRoundsService = GroupRoundsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        group_sessions_service_1.GroupSessionsService,
        study_groups_ws_gateway_1.StudyGroupsWebSocketGateway])
], GroupRoundsService);
//# sourceMappingURL=group-rounds.service.js.map