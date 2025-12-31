import { PrismaService } from "../prisma/prisma.service";
export declare class ErrorTrackingService {
    private prisma;
    constructor(prisma: PrismaService);
    logError(data: {
        message: string;
        stack?: string;
        endpoint?: string;
        method?: string;
        statusCode?: number;
        userId?: string;
        requestId?: string;
        metadata?: any;
    }): Promise<{
        id: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        method: string | null;
        timestamp: Date;
        user_id: string | null;
        endpoint: string | null;
        request_id: string | null;
        message: string;
        stack: string | null;
        status_code: number | null;
        resolved: boolean;
    }>;
    getErrors(filters: {
        from?: Date;
        to?: Date;
        resolved?: boolean;
        endpoint?: string;
        limit?: number;
    }): Promise<{
        id: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        method: string | null;
        timestamp: Date;
        user_id: string | null;
        endpoint: string | null;
        request_id: string | null;
        message: string;
        stack: string | null;
        status_code: number | null;
        resolved: boolean;
    }[]>;
    getErrorsByEndpoint(from: Date, to: Date): Promise<any[]>;
    markResolved(id: string): Promise<{
        id: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        method: string | null;
        timestamp: Date;
        user_id: string | null;
        endpoint: string | null;
        request_id: string | null;
        message: string;
        stack: string | null;
        status_code: number | null;
        resolved: boolean;
    }>;
    getErrorDetails(id: string): Promise<{
        id: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        method: string | null;
        timestamp: Date;
        user_id: string | null;
        endpoint: string | null;
        request_id: string | null;
        message: string;
        stack: string | null;
        status_code: number | null;
        resolved: boolean;
    }>;
    cleanupOldErrors(): Promise<number>;
}
