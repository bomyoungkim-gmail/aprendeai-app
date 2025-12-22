import { Controller, Post, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VocabService } from './vocab.service';

// TODO (Issue #9): Add proper AuthGuard in V5
@ApiTags('Vocabulary')
@Controller('vocab')
export class VocabController {
  constructor(private vocabService: VocabService) {}

  @Post('sessions/:sessionId/from-targets')
  @ApiOperation({ summary: 'Create vocab from session target words' })
  @ApiResponse({ status: 201, description: 'Vocabulary items created successfully' })
  async createFromTargets(@Req() req: any, @Param('sessionId') sessionId: string) {
    // TODO: Get userId from auth token
    const userId = req.user?.id || 'test-user-id';
    
    // Verify session ownership
    const session = await this.vocabService['prisma'].readingSession.findUnique({
      where: { id: sessionId },
    });
    
    if (!session || session.userId !== userId) {
      throw new Error('Forbidden');
    }
    
    return this.vocabService.createFromTargetWords(sessionId);
  }
}
