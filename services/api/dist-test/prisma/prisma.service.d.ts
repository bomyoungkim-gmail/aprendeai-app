import { OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    private readonly TENANT_MODELS;
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private registerMiddleware;
    private isReadOperation;
    private isWriteOperation;
}
