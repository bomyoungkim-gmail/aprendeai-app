import { OnModuleInit } from "@nestjs/common";
import { QueueService } from "./queue.service";
import { NotificationsGateway } from "../notifications/notifications.gateway";
import { PrismaService } from "../prisma/prisma.service";
import { AIContentService } from "../common/services/ai-content.service";
export declare class QueueConsumerService implements OnModuleInit {
    private queueService;
    private prisma;
    private aiContentService;
    private notificationsGateway;
    private readonly logger;
    private channel;
    constructor(queueService: QueueService, prisma: PrismaService, aiContentService: AIContentService, notificationsGateway: NotificationsGateway);
    onModuleInit(): Promise<void>;
    private startConsuming;
    private processMessage;
    private handleSimplification;
    private handleAssessment;
    private mapQuestionType;
}
