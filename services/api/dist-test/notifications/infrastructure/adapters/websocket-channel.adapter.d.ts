import { INotificationChannel } from '../../domain/interfaces/notification-channel.interface';
import { Notification } from '../../domain/entities/notification.entity';
import { NotificationsGateway } from '../../notifications.gateway';
export declare class WebSocketChannelAdapter implements INotificationChannel {
    private readonly gateway;
    constructor(gateway: NotificationsGateway);
    send(notification: Notification): Promise<void>;
    supports(notification: Notification): boolean;
}
