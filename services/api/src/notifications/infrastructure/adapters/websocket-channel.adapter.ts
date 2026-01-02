import { Injectable } from "@nestjs/common";
import { INotificationChannel } from "../../domain/interfaces/notification-channel.interface";
import { Notification } from "../../domain/entities/notification.entity";
import { NotificationsGateway } from "../../notifications.gateway";

@Injectable()
export class WebSocketChannelAdapter implements INotificationChannel {
  constructor(private readonly gateway: NotificationsGateway) {}

  async send(notification: Notification): Promise<void> {
    // The gateway has specific emit methods. We can generalize or use them.
    // For a generic notification, we might want a new emit method on the gateway.
    // For now, let's use a generic emit to the user's room.
    const room = `user:${notification.targetUserId}`;
    this.gateway.server.to(room).emit("notification", {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      priority: notification.priority,
      timestamp: notification.createdAt.toISOString(),
    });
  }

  supports(notification: Notification): boolean {
    return notification.channels.includes("WEBSOCKET");
  }
}
