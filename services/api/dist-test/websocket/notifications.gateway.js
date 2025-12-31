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
exports.NotificationsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const jwt_1 = require("@nestjs/jwt");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const ws_jwt_guard_1 = require("./guards/ws-jwt.guard");
const urls_config_1 = require("../config/urls.config");
let NotificationsGateway = class NotificationsGateway {
    constructor(jwtService) {
        this.jwtService = jwtService;
        this.logger = new common_1.Logger("NotificationsGateway");
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
            this.logger.log(`Client connected to notifications: ${client.id}, User: ${user.userId}`);
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
        if (user) {
            this.logger.log(`Client disconnected from notifications: ${client.id}, User: ${user.userId}`);
        }
    }
    handleSubscribeToContent(client, contentId) {
        const user = client.data.user;
        client.join(`content:${contentId}`);
        this.logger.log(`User ${user.userId} subscribed to content updates: ${contentId}`);
        return { success: true, message: `Subscribed to content ${contentId}` };
    }
    handleUnsubscribeFromContent(client, contentId) {
        const user = client.data.user;
        client.leave(`content:${contentId}`);
        this.logger.log(`User ${user.userId} unsubscribed from content: ${contentId}`);
        return { success: true, message: `Unsubscribed from content ${contentId}` };
    }
};
exports.NotificationsGateway = NotificationsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], NotificationsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)("subscribeToContent"),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], NotificationsGateway.prototype, "handleSubscribeToContent", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("unsubscribeFromContent"),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], NotificationsGateway.prototype, "handleUnsubscribeFromContent", null);
exports.NotificationsGateway = NotificationsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: urls_config_1.URL_CONFIG.corsOrigins,
            credentials: true,
        },
        namespace: "/notifications",
    }),
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], NotificationsGateway);
//# sourceMappingURL=notifications.gateway.js.map