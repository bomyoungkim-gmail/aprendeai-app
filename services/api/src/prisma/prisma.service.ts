import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '../common/context/request-context';

/**
 * Prisma Service with Multi-Tenancy Middleware
 * 
 * Phase 0: MVP-Hardening - Multi-Tenancy
 * Automatically filters queries by institution_id for tenant isolation
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  /**
   * Models that require tenant isolation
   * Add model names as they get institution_id column
   */
  private readonly TENANT_MODELS = [
    'ReadingSession',
    'SessionEvent',
    'UserVocabulary',
    'CornellNote',
    'Highlight',
    'DailyGoal',
    'Streak',
    'UserBadge',
  ];

  async onModuleInit() {
    await this.$connect();
    this.registerMiddleware();
    this.logger.log('Prisma connected with tenant isolation middleware');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Register tenant isolation middleware
   */
  private registerMiddleware() {
    this.$use(async (params, next) => {
      const user = getCurrentUser();
      
      // Skip if no user context (system operations, migrations)
      if (!user) {
        return next(params);
      }

      // Skip if model doesn't require tenant isolation
      if (!this.TENANT_MODELS.includes(params.model || '')) {
        return next(params);
      }

      // Auto-filter queries by institution_id
      if (this.isReadOperation(params.action)) {
        params.args.where = {
          ...params.args.where,
          institutionId: user.institutionId,
        };
      }

      // Auto-inject institution_id on creates
      if (params.action === 'create') {
        params.args.data = {
          ...params.args.data,
          institutionId: user.institutionId,
        };
      }

      // Auto-inject institution_id on createMany
      if (params.action === 'createMany') {
        if (Array.isArray(params.args.data)) {
          params.args.data = params.args.data.map(item => ({
            ...item,
            institutionId: user.institutionId,
          }));
        }
      }

      // Block cross-tenant updates/deletes
      if (this.isWriteOperation(params.action)) {
        params.args.where = {
          ...params.args.where,
          institutionId: user.institutionId,
        };
      }

      return next(params);
    });
  }

  /**
   * Check if operation reads data
   */
  private isReadOperation(action: string): boolean {
    return [
      'findUnique',
      'findFirst',
      'findMany',
      'count',
      'aggregate',
      'groupBy',
    ].includes(action);
  }

  /**
   * Check if operation writes/modifies data
   */
  private isWriteOperation(action: string): boolean {
    return [
      'update',
      'updateMany',
      'upsert',
      'delete',
      'deleteMany',
    ].includes(action);
  }
}

