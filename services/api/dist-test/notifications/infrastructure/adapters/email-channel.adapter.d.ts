import { INotificationChannel } from '../../domain/interfaces/notification-channel.interface';
import { Notification } from '../../domain/entities/notification.entity';
import { EmailService } from '../../../email/email.service';
export declare class EmailChannelAdapter implements INotificationChannel {
    private readonly emailService;
    constructor(emailService: EmailService);
    send(notification: Notification): Promise<void>;
    supports(notification: Notification): boolean;
}
