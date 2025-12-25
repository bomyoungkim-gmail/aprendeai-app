/**
 * Redis Helper for Context Enrichment
 * Loads compact pedagogical state and manages memory compaction jobs
 */
import Redis from "ioredis";
import { Logger } from "@nestjs/common";
import * as amqp from "amqplib";

const logger = new Logger("RedisContextHelper");

// Singleton Redis client (lazy init)
let redisClient: Redis | null = null;
// Use inferred types to avoid @types/amqplib mismatch (TS2739)
let rabbitConnection: any = null;
let rabbitChannel: any = null;

/**
 * Get or create Redis client
 */
function getRedisClient(): Redis {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379/0";
    redisClient = new Redis(redisUrl, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    redisClient.on("error", (err) => {
      logger.error(`Redis error: ${err.message}`);
    });

    redisClient.on("connect", () => {
      logger.log("Redis connected successfully");
    });
  }

  return redisClient;
}

/**
 * Get or create RabbitMQ channel
 */
async function getRabbitChannel(): Promise<any> {
  if (rabbitChannel && rabbitConnection) {
    return rabbitChannel;
  }

  const rabbitmqUrl = process.env.RABBITMQ_URL || "amqp://localhost:5672";

  try {
    rabbitConnection = await amqp.connect(rabbitmqUrl);
    rabbitChannel = await rabbitConnection.createChannel();

    // Declare memory.compact queue (idempotent)
    await rabbitChannel.assertQueue("memory.compact", { durable: true });

    logger.log("RabbitMQ channel ready for memory jobs");
    return rabbitChannel;
  } catch (err) {
    logger.warn(
      `RabbitMQ not available: ${err.message}. Memory jobs will be skipped.`,
    );
    return null;
  }
}

/**
 * Load compact pedagogical state from Redis
 * Returns null if not found or error
 */
export async function loadCompactState(
  tenantId: string,
  contentId: string,
): Promise<any | null> {
  try {
    const redis = getRedisClient();
    const key = `edu:state:${tenantId}:${contentId}`;
    const data = await redis.get(key);

    if (!data) {
      logger.debug(`No compact state found for ${key}`);
      return null;
    }

    return JSON.parse(data);
  } catch (err) {
    logger.warn(`Failed to load compact state: ${err.message}`);
    return null;
  }
}

/**
 * Enqueue memory compaction job
 * Safe to call even if RabbitMQ is unavailable
 */
export async function enqueueMemoryJob(job: {
  tenantId: string;
  userId: string;
  contentId: string;
  sessionOutcome: any;
}): Promise<boolean> {
  try {
    const channel = await getRabbitChannel();

    if (!channel) {
      logger.warn("RabbitMQ unavailable, skipping memory job");
      return false;
    }

    const success = channel.sendToQueue(
      "memory.compact",
      Buffer.from(JSON.stringify(job)),
      { persistent: true },
    );

    if (success) {
      logger.log(`Enqueued memory job for ${job.tenantId}/${job.contentId}`);
    } else {
      logger.warn("Failed to enqueue memory job (queue full?)");
    }

    return success;
  } catch (err) {
    logger.error(`Failed to enqueue memory job: ${err.message}`);
    return false;
  }
}

/**
 * Cleanup connections (call on app shutdown)
 */
export async function cleanup() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }

  if (rabbitChannel) {
    await rabbitChannel.close();
    rabbitChannel = null;
  }

  if (rabbitConnection) {
    await rabbitConnection.close();
    rabbitConnection = null;
  }

  logger.log("Redis and RabbitMQ connections closed");
}
