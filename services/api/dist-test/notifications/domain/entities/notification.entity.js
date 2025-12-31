"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
class Notification {
    constructor(id, targetUserId, type, title, message, data = {}, priority = 'MEDIUM', channels = ['WEBSOCKET'], createdAt = new Date()) {
        this.id = id;
        this.targetUserId = targetUserId;
        this.type = type;
        this.title = title;
        this.message = message;
        this.data = data;
        this.priority = priority;
        this.channels = channels;
        this.createdAt = createdAt;
    }
}
exports.Notification = Notification;
//# sourceMappingURL=notification.entity.js.map