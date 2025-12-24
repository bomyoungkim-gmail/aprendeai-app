import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ContentClassificationService } from './content-classification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../admin/guards/roles.guard';
import { Roles } from '../admin/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('content-classification')
@Controller('content-classification')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContentClassificationController {
  constructor(private classificationService: ContentClassificationService) {}

  @Post('classify')
  @Roles(UserRole.ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'AI-classify content for age appropriateness' })
  async classifyContent(@Body() dto: {
    title: string;
    description?: string;
    body?: string;
    existingClassification?: any;
  }) {
    return this.classificationService.classifyContent(dto);
  }

  @Post('suggest/:contentId')
  @Roles(UserRole.ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get AI classification suggestion for content' })
  async suggestClassification(
    @Param('contentId') contentId: string,
    @Body() dto: { title: string; description?: string }
  ) {
    return this.classificationService.suggestClassification(contentId, dto.title, dto.description);
  }

  @Post('filter')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Filter content by family age settings' })
  async filterContent(@Body() dto: {
    items: any[];
    familyAgeRange: { minAge: number; maxAge: number };
  }) {
    return this.classificationService.filterContentByAge(dto.items, dto.familyAgeRange);
  }
}
