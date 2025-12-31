import { OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
export interface ExtractionMessage {
    action: "EXTRACT_TEXT";
    contentId: string;
    timestamp: string;
}
export declare class QueueService implements OnModuleInit, OnModuleDestroy {
    private config;
    private connection;
    private channel;
    private readonly logger;
    private isConnecting;
    private isShuttingDown;
    private reconnectTimeout;
    constructor(config: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private connect;
    publishExtractionJob(contentId: string): Promise<void>;
    publish(queue: string, message: any): Promise<void>;
    isConnected(): boolean;
}
