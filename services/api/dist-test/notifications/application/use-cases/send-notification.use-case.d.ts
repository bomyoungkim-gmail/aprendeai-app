import { Notification } from '../../domain/entities/notification.entity';
import { INotificationChannel } from '../../domain/interfaces/notification-channel.interface';
export declare class SendNotificationUseCase {
    private readonly channels;
    private readonly logger;
    constructor(channels: INotificationChannel[]);
    execute(notification: Notification): Promise<void>;
}
