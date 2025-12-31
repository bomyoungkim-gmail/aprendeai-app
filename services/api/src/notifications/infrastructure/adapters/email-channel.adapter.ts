import { Injectable } from '@nestjs/common';
import { INotificationChannel } from '../../domain/interfaces/notification-channel.interface';
import { Notification } from '../../domain/entities/notification.entity';
import { EmailService } from '../../../email/email.service';

@Injectable()
export class EmailChannelAdapter implements INotificationChannel {
  constructor(private readonly emailService: EmailService) {}

  async send(notification: Notification): Promise<void> {
    // In a real scenario, we might map notification.type to a specific email template
    // For now, we use a generic method or map to existing ones
    await this.emailService.sendEmail({
      to: notification.data.email || '', // Assuming email is in data
      subject: notification.title,
      template: notification.data.template || 'generic',
      context: {
        ...notification.data,
        message: notification.message,
      },
    });
  }

  supports(notification: Notification): boolean {
    return notification.channels.includes('EMAIL');
  }
}
