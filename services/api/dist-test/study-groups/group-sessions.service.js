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
var GroupSessionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupSessionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const study_groups_service_1 = require("./study-groups.service");
const study_groups_ws_gateway_1 = require("../websocket/study-groups-ws.gateway");
const events_1 = require("../websocket/events");
const crypto = require("crypto");
let GroupSessionsService = GroupSessionsService_1 = class GroupSessionsService {
    constructor(prisma, studyGroupsService, wsGateway) {
        this.prisma = prisma;
        this.studyGroupsService = studyGroupsService;
        this.wsGateway = wsGateway;
        this.logger = new common_1.Logger(GroupSessionsService_1.name);
    }
    async createSession(group_id, user_id, dto) {
        await this.studyGroupsService.assertMembership(group_id, user_id);
        const content = await this.prisma.contents.findUnique({
            where: { id: dto.content_id },
        });
        if (!content) {
            throw new common_1.BadRequestException("Content not found");
        }
        const members = await this.studyGroupsService.getActiveMembers(group_id);
        if (members.length < 2) {
            throw new common_1.BadRequestException("Minimum 2 active members required for PI session");
        }
        const newSession = await this.prisma.$transaction(async (tx) => {
            const session = await tx.group_sessions.create({
                data: {
                    id: crypto.randomUUID(),
                    study_groups: { connect: { id: group_id } },
                    contents: { connect: { id: dto.content_id } },
                    mode: dto.mode || "PI_SPRINT",
                    layer: dto.layer || "L1",
                    status: "CREATED",
                },
            });
            await this.assignRoles(tx, session.id, group_id, members);
            const timers = this.getDefaultTimers(dto.layer || "L1");
            const roundsData = [];
            for (let i = 1; i <= dto.rounds_count; i++) {
                roundsData.push({
                    id: crypto.randomUUID(),
                    session_id: session.id,
                    round_index: i,
                    round_type: "PI",
                    prompt_json: { prompt_text: "", options: null },
                    timing_json: timers,
                    status: "CREATED",
                });
            }
            await tx.group_rounds.createMany({ data: roundsData });
            this.logger.log(`Created session ${session.id} with ${dto.rounds_count} rounds for group ${group_id}`);
            return session;
        });
        return this.getSession(newSession.id, user_id);
    }
    async getSession(sessionId, user_id) {
        const session = await this.prisma.group_sessions.findUnique({
            where: { id: sessionId },
            include: {
                study_groups: {
                    include: {
                        study_group_members: true,
                    },
                },
                contents: {
                    select: { id: true, title: true, type: true },
                },
                group_session_members: {
                    include: {
                        users: {
                            select: { id: true, name: true, email: true },
                        },
                    },
                },
                group_rounds: {
                    orderBy: { round_index: "asc" },
                },
            },
        });
        if (!session) {
            throw new common_1.BadRequestException("Session not found");
        }
        await this.studyGroupsService.assertMembership(session.group_id, user_id);
        return session;
    }
    async startSession(sessionId, user_id) {
        const session = await this.getSession(sessionId, user_id);
        if (session.status !== "CREATED") {
            throw new common_1.BadRequestException("Session already started");
        }
        await this.prisma.group_sessions.update({
            where: { id: sessionId },
            data: {
                status: "RUNNING",
                starts_at: new Date(),
            },
        });
        this.wsGateway.emitToSession(sessionId, events_1.StudyGroupEvent.SESSION_STARTED, {
            sessionId,
            status: "RUNNING",
            startedBy: user_id,
        });
        this.logger.log(`Started session ${sessionId}`);
    }
    async updateSessionStatus(sessionId, user_id, status) {
        const session = await this.getSession(sessionId, user_id);
        const member = await this.prisma.group_session_members.findUnique({
            where: { session_id_user_id: { session_id: sessionId, user_id } },
        });
        const groupMember = await this.prisma.study_group_members.findUnique({
            where: { group_id_user_id: { group_id: session.group_id, user_id } },
        });
        const canUpdate = (member === null || member === void 0 ? void 0 : member.assigned_role) === "FACILITATOR" ||
            ["OWNER", "MOD"].includes(groupMember === null || groupMember === void 0 ? void 0 : groupMember.role);
        if (!canUpdate) {
            throw new common_1.BadRequestException("Only FACILITATOR or group OWNER/MOD can update session status");
        }
        const updates = { status };
        if (status === "FINISHED") {
            updates.ends_at = new Date();
        }
        await this.prisma.group_sessions.update({
            where: { id: sessionId },
            data: updates,
        });
    }
    async getGroupSessions(group_id) {
        return this.prisma.group_sessions.findMany({
            where: { group_id },
            include: {
                _count: {
                    select: { group_rounds: true },
                },
            },
            orderBy: { created_at: "desc" },
        });
    }
    async assignRoles(tx, sessionId, group_id, members) {
        const sorted = [...members].sort((a, b) => a.user_id.localeCompare(b.user_id));
        const completedCount = await tx.group_sessions.count({
            where: {
                group_id,
                status: { in: ["FINISHED"] },
            },
        });
        const offset = completedCount % sorted.length;
        const roles = [
            "FACILITATOR",
            "TIMEKEEPER",
            "CLARIFIER",
            "CONNECTOR",
            "SCRIBE",
        ];
        const assignments = [];
        for (let i = 0; i < Math.min(sorted.length, 5); i++) {
            const memberIndex = (i + offset) % sorted.length;
            const role = roles[i];
            assignments.push({
                session_id: sessionId,
                user_id: sorted[memberIndex].user_id,
                assigned_role: role,
                attendance_status: "JOINED",
            });
        }
        await tx.group_session_members.createMany({ data: assignments });
        this.logger.log(`Assigned ${assignments.length} roles for session ${sessionId}, offset=${offset}`);
    }
    getDefaultTimers(layer) {
        const isAdvanced = layer === "L2" || layer === "L3";
        return {
            voteSec: isAdvanced ? 90 : 60,
            discussSec: isAdvanced ? 240 : 180,
            revoteSec: isAdvanced ? 90 : 60,
            explainSec: isAdvanced ? 240 : 180,
        };
    }
};
exports.GroupSessionsService = GroupSessionsService;
exports.GroupSessionsService = GroupSessionsService = GroupSessionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        study_groups_service_1.StudyGroupsService,
        study_groups_ws_gateway_1.StudyGroupsWebSocketGateway])
], GroupSessionsService);
//# sourceMappingURL=group-sessions.service.js.map