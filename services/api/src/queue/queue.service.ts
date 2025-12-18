import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

export interface ExtractionMessage {
  action: 'EXTRACT_TEXT';
  contentId: string;
  timestamp: string;
}

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private connection: any; // amqp.Connection
  private channel: any; // amqp.Channel
  private readonly logger = new Logger(QueueService.name);

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    try {
      const url = this.config.get('RABBITMQ_URL') || 'amqp://guest:guest@localhost:5672';
      this.logger.log(`Connecting to RabbitMQ at ${url}`);
      
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();
      
      this.logger.log('RabbitMQ connection established');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
      // Don't throw - allow app to start without RabbitMQ
    }
  }

  async onModuleDestroy() {
    try {
      await this.channel?.close();
      await this.connection?.close();
      this.logger.log('RabbitMQ connection closed');
    } catch (error) {
      this.logger.error('Error closing RabbitMQ connection', error);
    }
  }

  async publishExtractionJob(contentId: string): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    const queue = 'content.extract';
    await this.channel.assertQueue(queue, { durable: true });

    const message: ExtractionMessage = {
      action: 'EXTRACT_TEXT',
      contentId,
      timestamp: new Date().toISOString(),
    };

    this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
      persistent: true,
    });

    this.logger.log(`Published extraction job for content ${contentId}`);
  }

  // Generic publish method for future use
  async publish(queue: string, message: any): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    await this.channel.assertQueue(queue, { durable: true });
    this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
      persistent: true,
    });

    this.logger.log(`Published message to queue ${queue}`);
  }
}
