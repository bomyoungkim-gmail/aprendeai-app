"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var QueueService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const amqp = require("amqplib");
let QueueService = QueueService_1 = class QueueService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(QueueService_1.name);
        this.isConnecting = false;
        this.isShuttingDown = false;
        this.reconnectTimeout = null;
    }
    async onModuleInit() {
        await this.connect();
    }
    async onModuleDestroy() {
        var _a, _b;
        this.isShuttingDown = true;
        try {
            if (this.reconnectTimeout) {
                clearTimeout(this.reconnectTimeout);
            }
            await ((_a = this.channel) === null || _a === void 0 ? void 0 : _a.close());
            await ((_b = this.connection) === null || _b === void 0 ? void 0 : _b.close());
            this.logger.log("RabbitMQ connection closed");
        }
        catch (error) {
            this.logger.error("Error closing RabbitMQ connection", error);
        }
    }
    async connect(retries = 5, delay = 2000) {
        if (this.isConnecting || this.isShuttingDown) {
            this.logger.debug("Connection attempt skipped (already connecting or shutting down)");
            return;
        }
        this.isConnecting = true;
        const url = this.config.get("RABBITMQ_URL");
        if (!url) {
            if (this.config.get("NODE_ENV") === "production") {
                throw new Error("RABBITMQ_URL must be defined in production environment");
            }
            this.logger.warn("RABBITMQ_URL not found, falling back to localhost for development");
        }
        const connectionUrl = url || "amqp://guest:guest@localhost:5672";
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                if (this.isShuttingDown)
                    return;
                this.logger.log(`Connecting to RabbitMQ (attempt ${attempt}/${retries})...`);
                this.connection = await amqp.connect(url, {
                    timeout: 10000,
                });
                this.connection.on("error", (err) => {
                    this.logger.error("RabbitMQ connection error", err.message);
                });
                this.connection.on("close", () => {
                    if (this.isShuttingDown) {
                        this.logger.log("RabbitMQ connection closed gracefully");
                        return;
                    }
                    this.logger.warn("RabbitMQ connection closed, will attempt to reconnect in 5 seconds");
                    this.connection = null;
                    this.channel = null;
                    this.isConnecting = false;
                    this.reconnectTimeout = setTimeout(() => {
                        this.connect();
                    }, 5000);
                });
                this.channel = await this.connection.createChannel();
                this.logger.log("✅ RabbitMQ connection established successfully");
                this.isConnecting = false;
                return;
            }
            catch (error) {
                this.logger.error(`Failed to connect to RabbitMQ (attempt ${attempt}/${retries}): ${error.message}`);
                if (attempt < retries) {
                    const backoff = delay * attempt;
                    this.logger.log(`Retrying in ${backoff}ms...`);
                    await new Promise((resolve) => setTimeout(resolve, backoff));
                }
            }
        }
        this.logger.error("❌ Failed to connect to RabbitMQ after all retries. Queue operations will be disabled.");
        this.isConnecting = false;
    }
    async publishExtractionJob(contentId) {
        if (!this.channel) {
            this.logger.warn("RabbitMQ channel not available, skipping job publication for content " +
                contentId);
            return;
        }
        try {
            const queue = "content.extract";
            await this.channel.assertQueue(queue, { durable: true });
            const message = {
                action: "EXTRACT_TEXT",
                contentId,
                timestamp: new Date().toISOString(),
            };
            this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
                persistent: true,
            });
            this.logger.log(`Published extraction job for content ${contentId}`);
        }
        catch (error) {
            this.logger.error(`Failed to publish extraction job: ${error.message}`);
            throw error;
        }
    }
    async publish(queue, message) {
        if (!this.channel) {
            this.logger.warn(`RabbitMQ channel not available, skipping publication to queue ${queue}`);
            return;
        }
        try {
            await this.channel.assertQueue(queue, { durable: true });
            this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
                persistent: true,
            });
            this.logger.log(`Published message to queue ${queue}`);
        }
        catch (error) {
            this.logger.error(`Failed to publish to queue ${queue}: ${error.message}`);
            throw error;
        }
    }
    isConnected() {
        return this.channel !== null && this.connection !== null;
    }
};
exports.QueueService = QueueService;
exports.QueueService = QueueService = QueueService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], QueueService);
//# sourceMappingURL=queue.service.js.map