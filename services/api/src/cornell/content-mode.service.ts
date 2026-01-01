import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContentMode } from './dto/update-content-mode.dto';

@Injectable()
export class ContentModeService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get content mode with source of truth: PRODUCER > USER > HEURISTIC
   */
  async getMode(contentId: string): Promise<ContentMode | null> {
    const content = await this.prisma.contents.findUnique({
      where: { id: contentId },
      select: {
        mode: true,
        mode_source: true,
        title: true,
        type: true,
      },
    });

    if (!content) {
      throw new NotFoundException(`Content with ID ${contentId} not found`);
    }

    // Source of truth: PRODUCER > USER > HEURISTIC
    if (content.mode && content.mode_source === 'PRODUCER') {
      return content.mode as ContentMode;
    }

    if (content.mode && content.mode_source === 'USER') {
      return content.mode as ContentMode;
    }

    // Fallback: infer mode from content metadata
    return this.inferMode(content);
  }

  /**
   * Get full mode information including metadata
   */
  async getModeInfo(contentId: string) {
    const content = await this.prisma.contents.findUnique({
      where: { id: contentId },
      select: {
        mode: true,
        mode_source: true,
        mode_set_by: true,
        mode_set_at: true,
        title: true,
        type: true,
      },
    });

    if (!content) {
      throw new NotFoundException(`Content with ID ${contentId} not found`);
    }

    const inferredMode = content.mode ? null : this.inferMode(content);

    return {
      mode: content.mode as ContentMode | null,
      modeSource: content.mode_source,
      modeSetBy: content.mode_set_by,
      modeSetAt: content.mode_set_at,
      inferredMode,
    };
  }

  /**
   * Set content mode
   */
  async setMode(
    contentId: string,
    mode: ContentMode,
    userId: string,
    source: 'PRODUCER' | 'USER' = 'USER',
  ): Promise<void> {
    // Verify content exists
    const content = await this.prisma.contents.findUnique({
      where: { id: contentId },
      select: { id: true },
    });

    if (!content) {
      throw new NotFoundException(`Content with ID ${contentId} not found`);
    }

    // Update mode
    await this.prisma.contents.update({
      where: { id: contentId },
      data: {
        mode,
        mode_source: source,
        mode_set_by: userId,
        mode_set_at: new Date(),
      },
    });
  }

  /**
   * Infer mode from content metadata using simple heuristics
   */
  private inferMode(content: { title: string; type: string }): ContentMode {
    const title = content.title.toLowerCase();
    const type = content.type;

    // Check for language learning content
    if (
      title.includes('vocabulário') ||
      title.includes('vocabulary') ||
      title.includes('language') ||
      title.includes('idioma') ||
      title.includes('inglês') ||
      title.includes('english') ||
      title.includes('español') ||
      title.includes('french')
    ) {
      return ContentMode.LANGUAGE;
    }

    // Check for news content
    if (
      title.includes('notícia') ||
      title.includes('news') ||
      title.includes('jornal') ||
      title.includes('artigo') ||
      title.includes('reportagem')
    ) {
      return ContentMode.NEWS;
    }

    // Check for scientific content
    if (
      title.includes('científico') ||
      title.includes('scientific') ||
      title.includes('research') ||
      title.includes('paper') ||
      title.includes('estudo') ||
      title.includes('pesquisa') ||
      title.includes('journal')
    ) {
      return ContentMode.SCIENTIFIC;
    }

    // Check for technical content
    if (
      title.includes('técnico') ||
      title.includes('technical') ||
      title.includes('manual') ||
      title.includes('documentation') ||
      title.includes('guide') ||
      title.includes('tutorial') ||
      title.includes('api') ||
      title.includes('código')
    ) {
      return ContentMode.TECHNICAL;
    }

    // Check for didactic content
    if (
      title.includes('aula') ||
      title.includes('curso') ||
      title.includes('lesson') ||
      title.includes('course') ||
      title.includes('apostila') ||
      title.includes('exercício') ||
      title.includes('atividade') ||
      title.includes('lição')
    ) {
      return ContentMode.DIDACTIC;
    }

    // Default: NARRATIVE (stories, books, general reading)
    return ContentMode.NARRATIVE;
  }
}
