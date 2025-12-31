import { Injectable, Inject, Logger } from '@nestjs/common';
import { Notification } from '../../domain/entities/notification.entity';
import { INotificationChannel } from '../../domain/interfaces/notification-channel.interface';

@Injectable()
export class SendNotificationUseCase {
  private readonly logger = new Logger(SendNotificationUseCase.name);

  constructor(
    @Inject('NOTIFICATION_CHANNELS')
    private readonly channels: INotificationChannel[],
  ) {}

  async execute(notification: Notification): Promise<void> {
    this.logger.log(`Dispatching notification ${notification.id} (${notification.type}) to user ${notification.targetUserId}`);

    const dispatchPromises = this.channels
      .filter(channel => channel.supports(notification))
      .map(async (channel) => {
        try {
          await channel.send(notification);
        } catch (error) {
          this.logger.error(
            `Failed to send notification ${notification.id} via ${channel.constructor.name}: ${error.message}`,
            error.stack,
          );
        }
      });

    await Promise.all(dispatchPromises);
  }
}
