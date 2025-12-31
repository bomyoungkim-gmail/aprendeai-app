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
var NotificationsGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const urls_config_1 = require("../config/urls.config");
let NotificationsGateway = NotificationsGateway_1 = class NotificationsGateway {
    constructor(jwtService) {
        this.jwtService = jwtService;
        this.logger = new common_1.Logger(NotificationsGateway_1.name);
    }
    async handleConnection(client) {
        var _a;
        try {
            const token = client.handshake.auth.token ||
                ((_a = client.handshake.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1]);
            if (!token) {
                throw new common_1.UnauthorizedException("No token provided");
            }
            const payload = await this.jwtService.verifyAsync(token);
            client.data.userId = payload.sub || payload.id;
            this.logger.log(`Client connected: ${client.id} (User: ${client.data.userId})`);
        }
        catch (error) {
            this.logger.error(`Connection rejected: ${error.message}`);
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    handleSubscribeToContent(client, contentId) {
        const room = `content:${contentId}`;
        client.join(room);
        this.logger.log(`Client ${client.id} subscribed to ${room}`);
        return { success: true, room };
    }
    handleUnsubscribeFromContent(client, contentId) {
        const room = `content:${contentId}`;
        client.leave(room);
        this.logger.log(`Client ${client.id} unsubscribed from ${room}`);
        return { success: true };
    }
    emitContentUpdate(contentId, type) {
        const room = `content:${contentId}`;
        this.server.to(room).emit("contentUpdated", {
            contentId,
            type,
            timestamp: new Date().toISOString(),
            success: true,
        });
        this.logger.log(`Emitted contentUpdated to ${room} (type: ${type})`);
    }
    emitContentError(contentId, type, errorKey, message) {
        const room = `content:${contentId}`;
        this.server.to(room).emit("contentError", {
            contentId,
            type,
            error: errorKey,
            message,
            timestamp: new Date().toISOString(),
            success: false,
        });
        this.logger.error(`Emitted contentError to ${room}: ${errorKey}`);
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
exports.NotificationsGateway = NotificationsGateway = NotificationsGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: urls_config_1.URL_CONFIG.corsOrigins,
            credentials: true,
        },
        namespace: "notifications",
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], NotificationsGateway);
//# sourceMappingURL=notifications.gateway.js.map