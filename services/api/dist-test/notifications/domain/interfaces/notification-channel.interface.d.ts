import { Notification } from '../entities/notification.entity';
export interface INotificationChannel {
    send(notification: Notification): Promise<void>;
    supports(notification: Notification): boolean;
}
