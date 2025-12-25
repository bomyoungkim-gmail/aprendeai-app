import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as amqp from "amqplib";

export interface ExtractionMessage {
  action: "EXTRACT_TEXT";
  contentId: string;
  timestamp: string;
}

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private connection: any; // amqplib Connection type has quirks
  private channel: any; // amqplib Channel type
  private readonly logger = new Logger(QueueService.name);
  private isConnecting = false;
  private isShuttingDown = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    this.isShuttingDown = true;
    try {
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }
      await this.channel?.close();
      await this.connection?.close();
      this.logger.log("RabbitMQ connection closed");
    } catch (error) {
      this.logger.error("Error closing RabbitMQ connection", error);
    }
  }

  private async connect(retries = 5, delay = 2000): Promise<void> {
    if (this.isConnecting || this.isShuttingDown) {
      this.logger.debug(
        "Connection attempt skipped (already connecting or shutting down)",
      );
      return;
    }

    this.isConnecting = true;
    const url = this.config.get<string>("RABBITMQ_URL");

    if (!url) {
      if (this.config.get("NODE_ENV") === "production") {
        throw new Error(
          "RABBITMQ_URL must be defined in production environment",
        );
      }
      this.logger.warn(
        "RABBITMQ_URL not found, falling back to localhost for development",
      );
    }

    const connectionUrl = url || "amqp://guest:guest@localhost:5672";

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        if (this.isShuttingDown) return;

        this.logger.log(
          `Connecting to RabbitMQ (attempt ${attempt}/${retries})...`,
        );

        this.connection = await amqp.connect(url, {
          timeout: 10000, // 10 second timeout
        });

        // Setup connection event handlers for automatic reconnection
        this.connection.on("error", (err) => {
          this.logger.error("RabbitMQ connection error", err.message);
        });

        this.connection.on("close", () => {
          if (this.isShuttingDown) {
            this.logger.log("RabbitMQ connection closed gracefully");
            return;
          }

          this.logger.warn(
            "RabbitMQ connection closed, will attempt to reconnect in 5 seconds",
          );
          this.connection = null;
          this.channel = null;
          this.isConnecting = false;

          // Schedule reconnection
          this.reconnectTimeout = setTimeout(() => {
            this.connect();
          }, 5000);
        });

        this.channel = await this.connection.createChannel();

        this.logger.log("✅ RabbitMQ connection established successfully");
        this.isConnecting = false;
        return;
      } catch (error) {
        this.logger.error(
          `Failed to connect to RabbitMQ (attempt ${attempt}/${retries}): ${error.message}`,
        );

        if (attempt < retries) {
          const backoff = delay * attempt; // Exponential backoff
          this.logger.log(`Retrying in ${backoff}ms...`);
          await new Promise((resolve) => setTimeout(resolve, backoff));
        }
      }
    }

    this.logger.error(
      "❌ Failed to connect to RabbitMQ after all retries. Queue operations will be disabled.",
    );
    this.isConnecting = false;
  }

  async publishExtractionJob(contentId: string): Promise<void> {
    if (!this.channel) {
      this.logger.warn(
        "RabbitMQ channel not available, skipping job publication for content " +
          contentId,
      );
      return; // Graceful degradation
    }

    try {
      const queue = "content.extract";
      await this.channel.assertQueue(queue, { durable: true });

      const message: ExtractionMessage = {
        action: "EXTRACT_TEXT",
        contentId,
        timestamp: new Date().toISOString(),
      };

      this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
        persistent: true,
      });

      this.logger.log(`Published extraction job for content ${contentId}`);
    } catch (error) {
      this.logger.error(`Failed to publish extraction job: ${error.message}`);
      throw error;
    }
  }

  // Generic publish method for future use
  async publish(queue: string, message: any): Promise<void> {
    if (!this.channel) {
      this.logger.warn(
        `RabbitMQ channel not available, skipping publication to queue ${queue}`,
      );
      return; // Graceful degradation
    }

    try {
      await this.channel.assertQueue(queue, { durable: true });
      this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
        persistent: true,
      });

      this.logger.log(`Published message to queue ${queue}`);
    } catch (error) {
      this.logger.error(
        `Failed to publish to queue ${queue}: ${error.message}`,
      );
      throw error;
    }
  }

  // Health check method
  isConnected(): boolean {
    return this.channel !== null && this.connection !== null;
  }
}
