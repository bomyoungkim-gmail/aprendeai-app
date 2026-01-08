import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ContentMode } from "@prisma/client";

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
        raw_text: true, // Needed for narrative detection
      },
    });

    if (!content) {
      throw new NotFoundException(`Content with ID ${contentId} not found`);
    }

    // Source of truth: PRODUCER > USER > HEURISTIC
    if (content.mode && content.mode_source === "PRODUCER") {
      return content.mode as ContentMode;
    }

    if (content.mode && content.mode_source === "USER") {
      return content.mode as ContentMode;
    }

    // P3: Infer mode if not set (Script 02)
    const inferredMode = this.inferMode(content);

    // Lazy persistence: Save inferred mode to DB (idempotent)
    if (!content.mode) {
      await this.prisma.contents.update({
        where: { id: contentId },
        data: {
          mode: inferredMode,
          mode_source: 'HEURISTIC',
          mode_set_by: 'SYSTEM',
          mode_set_at: new Date(),
        },
      });
    }

    return inferredMode;
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
    source: "PRODUCER" | "USER" = "USER",
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
   * Infer mode from content metadata using ContentType-based rules (Script 02)
   * Priority: ContentType mapping > Narrative detection > Title-based heuristics
   */
  private inferMode(content: { title: string; type: string; raw_text?: string }): ContentMode {
    const title = content.title.toLowerCase();
    const type = content.type;

    // P3.1: Direct ContentType mappings (Script 02)
    if (type === 'NEWS') {
      return ContentMode.NEWS;
    }
    if (type === 'ARXIV') {
      return ContentMode.SCIENTIFIC;
    }
    if (type === 'SCHOOL_MATERIAL') {
      return ContentMode.DIDACTIC;
    }

    // P3.2: Narrative detection heuristic for ARTICLE/TEXT/WEB_CLIP
    if (['ARTICLE', 'TEXT', 'WEB_CLIP'].includes(type)) {
      if (this.detectNarrative(content.raw_text || '')) {
        return ContentMode.NARRATIVE;
      }
      // Default for these types if not narrative
      return ContentMode.TECHNICAL;
    }

    // P3.3: VIDEO/AUDIO - inherit from transcript/description (future enhancement)
    // For now, default to TECHNICAL
    if (['VIDEO', 'AUDIO'].includes(type)) {
      return ContentMode.TECHNICAL;
    }

    // Fallback: Title-based heuristics (existing logic)
    // Check for language learning content
    if (
      title.includes("vocabulário") ||
      title.includes("vocabulary") ||
      title.includes("language") ||
      title.includes("idioma") ||
      title.includes("inglês") ||
      title.includes("english") ||
      title.includes("español") ||
      title.includes("french")
    ) {
      return ContentMode.LANGUAGE;
    }

    // Check for news content
    if (
      title.includes("notícia") ||
      title.includes("news") ||
      title.includes("jornal") ||
      title.includes("artigo") ||
      title.includes("reportagem")
    ) {
      return ContentMode.NEWS;
    }

    // Check for scientific content
    if (
      title.includes("científico") ||
      title.includes("scientific") ||
      title.includes("research") ||
      title.includes("paper") ||
      title.includes("estudo") ||
      title.includes("pesquisa") ||
      title.includes("journal")
    ) {
      return ContentMode.SCIENTIFIC;
    }

    // Check for technical content
    if (
      title.includes("técnico") ||
      title.includes("technical") ||
      title.includes("manual") ||
      title.includes("documentation") ||
      title.includes("guide") ||
      title.includes("tutorial") ||
      title.includes("api") ||
      title.includes("código")
    ) {
      return ContentMode.TECHNICAL;
    }

    // Check for didactic content
    if (
      title.includes("aula") ||
      title.includes("curso") ||
      title.includes("lesson") ||
      title.includes("course") ||
      title.includes("apostila") ||
      title.includes("exercício") ||
      title.includes("atividade") ||
      title.includes("lição")
    ) {
      return ContentMode.DIDACTIC;
    }

    // Default: TECHNICAL (conservative default)
    return ContentMode.TECHNICAL;
  }

  /**
   * Detect narrative content using dialogue ratio heuristic
   * Returns true if content appears to be narrative/fiction
   */
  private detectNarrative(text: string): boolean {
    if (!text || text.length < 100) return false;

    // Count quotation marks (dialogue indicator)
    const dialogueMarks = (text.match(/["'""'']/g) || []).length;
    const dialogueRatio = dialogueMarks / text.length;

    // Threshold: if >1% of characters are dialogue marks, likely narrative
    return dialogueRatio > 0.01;
  }
}
