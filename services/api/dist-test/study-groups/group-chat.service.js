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
exports.GroupChatService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const group_sessions_service_1 = require("./group-sessions.service");
const crypto = require("crypto");
let GroupChatService = class GroupChatService {
    constructor(prisma, groupSessionsService) {
        this.prisma = prisma;
        this.groupSessionsService = groupSessionsService;
    }
    async sendMessage(sessionId, userId, dto) {
        var _a, _b;
        const session = await this.groupSessionsService.getSession(sessionId, userId);
        const round = (_a = session.group_rounds) === null || _a === void 0 ? void 0 : _a.find((r) => r.round_index === dto.round_index);
        if (!round) {
            throw new common_1.BadRequestException("Round not found");
        }
        const sanitizedMessage = dto.message
            .trim()
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
            .replace(/<[^>]*>/g, "");
        if (!sanitizedMessage) {
            throw new common_1.BadRequestException("Message cannot be empty after sanitization");
        }
        const chatMessage = await this.prisma.group_chat_messages.create({
            data: {
                id: crypto.randomUUID(),
                session_id: sessionId,
                round_id: round.id,
                user_id: userId,
                message: sanitizedMessage,
            },
            include: {
                users: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        const sessionMember = (_b = session.group_session_members) === null || _b === void 0 ? void 0 : _b.find((m) => m.user_id === userId);
        return Object.assign(Object.assign({}, chatMessage), { userRole: (sessionMember === null || sessionMember === void 0 ? void 0 : sessionMember.assigned_role) || null });
    }
    async getMessages(sessionId, roundIndex, userId) {
        var _a;
        const session = await this.groupSessionsService.getSession(sessionId, userId);
        const round = (_a = session.group_rounds) === null || _a === void 0 ? void 0 : _a.find((r) => r.round_index === roundIndex);
        if (!round) {
            throw new common_1.BadRequestException("Round not found");
        }
        const messages = await this.prisma.group_chat_messages.findMany({
            where: {
                session_id: sessionId,
                round_id: round.id,
            },
            include: {
                users: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                created_at: "asc",
            },
        });
        const messagesWithRoles = messages.map((msg) => {
            var _a;
            const sessionMember = (_a = session.group_session_members) === null || _a === void 0 ? void 0 : _a.find((m) => m.user_id === msg.user_id);
            return Object.assign(Object.assign({}, msg), { userRole: (sessionMember === null || sessionMember === void 0 ? void 0 : sessionMember.assigned_role) || null });
        });
        return messagesWithRoles;
    }
};
exports.GroupChatService = GroupChatService;
exports.GroupChatService = GroupChatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        group_sessions_service_1.GroupSessionsService])
], GroupChatService);
//# sourceMappingURL=group-chat.service.js.map