"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadCompactState = loadCompactState;
exports.enqueueMemoryJob = enqueueMemoryJob;
exports.cleanup = cleanup;
const ioredis_1 = require("ioredis");
const common_1 = require("@nestjs/common");
const amqp = require("amqplib");
const logger = new common_1.Logger("RedisContextHelper");
let redisClient = null;
let rabbitConnection = null;
let rabbitChannel = null;
function getRedisClient() {
    if (!redisClient) {
        const redisUrl = process.env.REDIS_URL || "redis://localhost:6379/0";
        redisClient = new ioredis_1.default(redisUrl, {
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
async function getRabbitChannel() {
    if (rabbitChannel && rabbitConnection) {
        return rabbitChannel;
    }
    const rabbitmqUrl = process.env.RABBITMQ_URL || "amqp://localhost:5672";
    try {
        rabbitConnection = await amqp.connect(rabbitmqUrl);
        rabbitChannel = await rabbitConnection.createChannel();
        await rabbitChannel.assertQueue("memory.compact", { durable: true });
        logger.log("RabbitMQ channel ready for memory jobs");
        return rabbitChannel;
    }
    catch (err) {
        logger.warn(`RabbitMQ not available: ${err.message}. Memory jobs will be skipped.`);
        return null;
    }
}
async function loadCompactState(tenantId, contentId) {
    try {
        const redis = getRedisClient();
        const key = `edu:state:${tenantId}:${contentId}`;
        const data = await redis.get(key);
        if (!data) {
            logger.debug(`No compact state found for ${key}`);
            return null;
        }
        return JSON.parse(data);
    }
    catch (err) {
        logger.warn(`Failed to load compact state: ${err.message}`);
        return null;
    }
}
async function enqueueMemoryJob(job) {
    try {
        const channel = await getRabbitChannel();
        if (!channel) {
            logger.warn("RabbitMQ unavailable, skipping memory job");
            return false;
        }
        const success = channel.sendToQueue("memory.compact", Buffer.from(JSON.stringify(job)), { persistent: true });
        if (success) {
            logger.log(`Enqueued memory job for ${job.tenantId}/${job.contentId}`);
        }
        else {
            logger.warn("Failed to enqueue memory job (queue full?)");
        }
        return success;
    }
    catch (err) {
        logger.error(`Failed to enqueue memory job: ${err.message}`);
        return false;
    }
}
async function cleanup() {
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
//# sourceMappingURL=redis-context.helper.js.map