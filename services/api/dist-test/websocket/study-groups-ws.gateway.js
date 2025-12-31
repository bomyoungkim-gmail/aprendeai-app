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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudyGroupsWebSocketGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const jwt_1 = require("@nestjs/jwt");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const ws_jwt_guard_1 = require("./guards/ws-jwt.guard");
const urls_config_1 = require("../config/urls.config");
let StudyGroupsWebSocketGateway = class StudyGroupsWebSocketGateway {
    constructor(jwtService) {
        this.jwtService = jwtService;
        this.logger = new common_1.Logger("StudyGroupsWebSocketGateway");
    }
    handleConnection(client) {
        try {
            const token = this.extractToken(client);
            if (!token) {
                client.disconnect();
                return;
            }
            try {
                const payload = this.jwtService.verify(token);
                client.data.user = {
                    userId: payload.sub,
                    email: payload.email,
                    name: payload.name,
                };
            }
            catch (err) {
                client.disconnect();
                return;
            }
        }
        catch (e) {
            client.disconnect();
            return;
        }
        const user = client.data.user;
        if (user) {
            this.logger.log(`Client connected: ${client.id}, User: ${user.userId}`);
        }
    }
    extractToken(client) {
        var _a, _b;
        const token = ((_a = client.handshake.auth) === null || _a === void 0 ? void 0 : _a.token) || ((_b = client.handshake.query) === null || _b === void 0 ? void 0 : _b.token);
        if (typeof token === "string") {
            return token.startsWith("Bearer ") ? token.substring(7) : token;
        }
        return undefined;
    }
    handleDisconnect(client) {
        const user = client.data.user;
        this.logger.log(`Client disconnected: ${client.id}, User: ${user === null || user === void 0 ? void 0 : user.userId}`);
    }
    handleJoinSession(client, data) {
        const { sessionId } = data;
        const user = client.data.user;
        client.join(`session:${sessionId}`);
        this.logger.log(`User ${user.userId} joined session ${sessionId}`);
        client.to(`session:${sessionId}`).emit("userJoined", {
            userId: user.userId,
            userName: user.name,
            timestamp: new Date().toISOString(),
        });
        return { success: true, message: `Joined session ${sessionId}` };
    }
    handleLeaveSession(client, data) {
        const { sessionId } = data;
        const user = client.data.user;
        client.leave(`session:${sessionId}`);
        this.logger.log(`User ${user.userId} left session ${sessionId}`);
        client.to(`session:${sessionId}`).emit("userLeft", {
            userId: user.userId,
            userName: user.name,
            timestamp: new Date().toISOString(),
        });
        return { success: true, message: `Left session ${sessionId}` };
    }
    emitToSession(sessionId, event, data) {
        this.server.to(`session:${sessionId}`).emit(event, Object.assign(Object.assign({}, data), { timestamp: new Date().toISOString() }));
        this.logger.log(`Emitted ${event} to session ${sessionId}`);
    }
    emitToGroup(groupId, event, data) {
        this.server.to(`group:${groupId}`).emit(event, data);
        this.logger.debug(`Emitted ${event} to group ${groupId}`);
    }
};
exports.StudyGroupsWebSocketGateway = StudyGroupsWebSocketGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], StudyGroupsWebSocketGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)("joinSession"),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], StudyGroupsWebSocketGateway.prototype, "handleJoinSession", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("leaveSession"),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], StudyGroupsWebSocketGateway.prototype, "handleLeaveSession", null);
exports.StudyGroupsWebSocketGateway = StudyGroupsWebSocketGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: urls_config_1.URL_CONFIG.corsOrigins,
            credentials: true,
        },
        namespace: "/study-groups",
    }),
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], StudyGroupsWebSocketGateway);
//# sourceMappingURL=study-groups-ws.gateway.js.map