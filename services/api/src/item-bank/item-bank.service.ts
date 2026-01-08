import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItemDto } from './dto/create-item.dto';
import { Prisma, ItemType, Language, ScopeType, ItemVisibility } from '@prisma/client';

@Injectable()
export class ItemBankService {
  constructor(private readonly prisma: PrismaService) {}

  async createItem(data: CreateItemDto) {
    // ✅ Map camelCase DTO to snake_case Prisma
    return this.prisma.item_bank.create({
      data: {
        ...data,
        scope_type: data.scopeType,
        scope_id: data.scopeId,
        created_by: data.createdBy,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.item_bank.findUnique({
      where: { id },
    });
  }

  async findAll(params: {
    type?: ItemType;
    language?: Language;
    tags?: string[];
    tagsMatchMode?: 'some' | 'every';
    difficulty?: number;
    limit?: number;
    // Security filtering (camelCase)
    scopeType?: ScopeType;
    scopeId?: string;
    visibility?: ItemVisibility;
    includePublic?: boolean;  // Include PUBLIC items in results
  }) {
    const {
      type,
      language,
      tags,
      tagsMatchMode = 'some',
      difficulty,
      limit,
      scopeType,
      scopeId,
      visibility,
      includePublic = true,
    } = params;
    
    // Build where clause
    const where: Prisma.item_bankWhereInput = {};
    if (type) where.type = type;
    if (language) where.language = language;
    if (difficulty) {
        // Approximate match logic if needed, currently exact or handled by caller logic
    }
    if (tags && tags.length > 0) {
        if (tagsMatchMode === 'every') {
             where.tags = { hasEvery: tags };
        } else {
             where.tags = { hasSome: tags };
        }
    }

    // Security: Filter by scope and visibility
    if (scopeType && scopeId) {
      const scopeConditions: Prisma.item_bankWhereInput[] = [
        // Items in the same scope (map to snake_case)
        { scope_type: scopeType, scope_id: scopeId },
      ];

      // Optionally include public items
      if (includePublic) {
        scopeConditions.push({ visibility: ItemVisibility.PUBLIC });
      }

      where.OR = scopeConditions;
    } else if (visibility) {
      where.visibility = visibility;
    }

    return this.prisma.item_bank.findMany({
      where,
      take: limit,
      orderBy: { updated_at: 'desc' }
    });
  }

  /**
   * Find items accessible within a specific scope
   * @param scopeType - USER, INSTITUTION, or FAMILY
   * @param scopeId - The ID of the user, institution, or family
   * @param filters - Additional filters (type, language, etc.)
   */
  async findAllInScope(
    scopeType: ScopeType,
    scopeId: string,
    filters?: {
      type?: ItemType;
      language?: Language;
      tags?: string[];
      limit?: number;
    }
  ) {
    return this.findAll({
      ...filters,
      scopeType,  // ✅ camelCase parameter
      scopeId,
      includePublic: true,  // Always include public items
    });
  }

  /**
   * Check if a user has access to an item based on visibility rules
   * @param itemId - The item ID
   * @param userId - The user requesting access
   * @param scopeType - The scope type of the requesting context
   * @param scopeId - The scope ID of the requesting context
   */
  async canAccess(
    itemId: string,
    userId: string,
    scopeType?: ScopeType,
    scopeId?: string
  ): Promise<boolean> {
    const item = await this.prisma.item_bank.findUnique({
      where: { id: itemId },
      select: {
        scope_type: true,
        scope_id: true,
        visibility: true,
        created_by: true,
      },
    });

    if (!item) return false;

    // PUBLIC items are accessible by everyone
    if (item.visibility === ItemVisibility.PUBLIC) {
      return true;
    }

    // PRIVATE items only accessible by creator
    if (item.visibility === ItemVisibility.PRIVATE) {
      return item.created_by === userId;
    }

    // INSTITUTION visibility: check if user is in same institution
    if (item.visibility === ItemVisibility.INSTITUTION) {
      if (scopeType === ScopeType.INSTITUTION && scopeId === item.scope_id) {
        return true;
      }
    }

    // Default: no access
    return false;
  }
}
