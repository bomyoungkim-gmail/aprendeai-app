import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EmailService } from './email.service';

export interface EmailJob {
  type: 'welcome' | 'group-invitation' | 'annotation-notification' | 'study-reminder';
  data: any;
}

@Processor('email')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<EmailJob>): Promise<void> {
    this.logger.log(`Processing email job: ${job.id} (${job.data.type})`);

    try {
      switch (job.data.type) {
        case 'welcome':
          await this.emailService.sendWelcomeEmail(job.data.data);
          break;

        case 'group-invitation':
          await this.emailService.sendGroupInvitationEmail(job.data.data);
          break;

        case 'annotation-notification':
          await this.emailService.sendAnnotationNotification(job.data.data);
          break;

        case 'study-reminder':
          await this.emailService.sendStudyReminder(job.data.data);
          break;

        default:
          throw new Error(`Unknown email type: ${job.data.type}`);
      }

      this.logger.log(`Email sent successfully: ${job.id}`);
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      throw error; // Bull will retry based on job options
    }
  }
}
