import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ErrorTrackingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Log error for debugging and monitoring
   */
  async logError(data: {
    message: string;
    stack?: string;
    endpoint?: string;
    method?: string;
    statusCode?: number;
    userId?: string;
    requestId?: string;
    metadata?: any;
  }) {
    try {
      return await this.prisma.errorLog.create({
        data: {
          message: data.message,
          stack: data.stack,
          endpoint: data.endpoint,
          method: data.method,
          statusCode: data.statusCode,
          userId: data.userId,
          requestId: data.requestId,
          metadata: data.metadata,
          timestamp: new Date(),
          resolved: false,
        },
      });
    } catch (error) {
      // Fallback to console if DB fails
      console.error("Failed to log error to DB:", error);
      console.error("Original error:", data);
    }
  }

  /**
   * Get errors with filters
   */
  async getErrors(filters: {
    from?: Date;
    to?: Date;
    resolved?: boolean;
    endpoint?: string;
    limit?: number;
  }) {
    const where: any = {};

    if (filters.from || filters.to) {
      where.timestamp = {};
      if (filters.from) where.timestamp.gte = filters.from;
      if (filters.to) where.timestamp.lte = filters.to;
    }

    if (filters.resolved !== undefined) {
      where.resolved = filters.resolved;
    }

    if (filters.endpoint) {
      where.endpoint = filters.endpoint;
    }

    return this.prisma.errorLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: filters.limit || 100,
    });
  }

  /**
   * Get error count by endpoint
   */
  async getErrorsByEndpoint(from: Date, to: Date) {
    const errors = await this.prisma.errorLog.findMany({
      where: {
        timestamp: { gte: from, lte: to },
      },
      select: {
        endpoint: true,
        statusCode: true,
      },
    });

    // Group by endpoint
    const grouped = errors.reduce(
      (acc, err) => {
        const endpoint = err.endpoint || "unknown";
        if (!acc[endpoint]) {
          acc[endpoint] = { endpoint, count: 0, codes: {} };
        }
        acc[endpoint].count++;
        const code = err.statusCode || 500;
        acc[endpoint].codes[code] = (acc[endpoint].codes[code] || 0) + 1;
        return acc;
      },
      {} as Record<string, any>,
    );

    return Object.values(grouped);
  }

  /**
   * Mark error as resolved
   */
  async markResolved(id: string) {
    return this.prisma.errorLog.update({
      where: { id },
      data: { resolved: true },
    });
  }

  /**
   * Get error details by ID
   */
  async getErrorDetails(id: string) {
    return this.prisma.errorLog.findUnique({
      where: { id },
    });
  }

  /**
   * Cleanup old resolved errors (keep 30 days)
   */
  async cleanupOldErrors() {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await this.prisma.errorLog.deleteMany({
      where: {
        resolved: true,
        timestamp: { lt: cutoff },
      },
    });

    return result.count;
  }
}
