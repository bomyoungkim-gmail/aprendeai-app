/**
 * Section Detection Service
 *
 * Application layer - orchestrates use cases
 * Following MelhoresPraticas.txt: application layer for orchestration
 */

import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export interface Section {
  id: string;
  title: string;
  startLine: number;
  endLine?: number;
  type: "IMRAD" | "HEADING" | "PARAGRAPH";
}

@Injectable()
export class SectionDetectionService {
  constructor(private prisma: PrismaService) {}

  async detectSections(contentId: string, mode?: string): Promise<Section[]> {
    // Fetch content
    const content = await this.prisma.contents.findUnique({
      where: { id: contentId },
      select: {
        id: true,
        title: true,
        // Note: raw_text might not exist in schema, using title as fallback
      },
    });

    if (!content) {
      throw new NotFoundException(`Content ${contentId} not found`);
    }

    // Use title as text for now (would use raw_text if available)
    const text = content.title;

    // Detect sections based on mode
    if (mode === "SCIENTIFIC") {
      return this.detectIMRaDSections(text);
    }

    // Try heading detection
    const headingSections = this.detectHeadingSections(text);
    if (headingSections.length >= 2) {
      return headingSections;
    }

    // Fallback to paragraph chunking
    return this.chunkByParagraphs(text);
  }

  /**
   * Domain logic: Detect IMRaD structure
   */
  private detectIMRaDSections(text: string): Section[] {
    const IMRAD_PATTERNS = [
      { section: "ABSTRACT", patterns: [/^abstract$/i, /^resumo$/i] },
      {
        section: "INTRODUCTION",
        patterns: [/^introduction$/i, /^introdução$/i, /^1\.?\s*introduction/i],
      },
      {
        section: "METHODS",
        patterns: [
          /^methods?$/i,
          /^methodology$/i,
          /^materiais?\s+e\s+métodos/i,
        ],
      },
      { section: "RESULTS", patterns: [/^results?$/i, /^resultados?$/i] },
      { section: "DISCUSSION", patterns: [/^discussion$/i, /^discussão$/i] },
      { section: "CONCLUSION", patterns: [/^conclusion$/i, /^conclusão$/i] },
    ];

    const lines = text.split("\n");
    const sections: Section[] = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      for (const { section, patterns } of IMRAD_PATTERNS) {
        if (patterns.some((p) => p.test(trimmed))) {
          sections.push({
            id: `${section.toLowerCase()}-${index}`,
            title: section,
            startLine: index,
            type: "IMRAD",
          });
          break;
        }
      }
    });

    // Calculate end lines
    sections.forEach((section, index) => {
      if (index < sections.length - 1) {
        section.endLine = sections[index + 1].startLine - 1;
      } else {
        section.endLine = lines.length - 1;
      }
    });

    return sections;
  }

  /**
   * Domain logic: Detect heading-based sections
   */
  private detectHeadingSections(text: string): Section[] {
    const lines = text.split("\n");
    const sections: Section[] = [];

    const headingPatterns = [
      /^#{1,3}\s+(.+)$/, // Markdown headings
      /^([A-Z][A-Za-z\s]+):?\s*$/, // Title case lines
      /^\d+\.?\s+([A-Z].+)$/, // Numbered headings
    ];

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      for (const pattern of headingPatterns) {
        const match = trimmed.match(pattern);
        if (match) {
          const title = match[1] || trimmed;
          sections.push({
            id: `heading-${index}`,
            title: title.trim(),
            startLine: index,
            type: "HEADING",
          });
          break;
        }
      }
    });

    // Calculate end lines
    sections.forEach((section, index) => {
      if (index < sections.length - 1) {
        section.endLine = sections[index + 1].startLine - 1;
      } else {
        section.endLine = lines.length - 1;
      }
    });

    return sections;
  }

  /**
   * Domain logic: Chunk by paragraphs
   */
  private chunkByParagraphs(text: string, minLength: number = 200): Section[] {
    const paragraphs = text.split(/\n\n+/);
    const sections: Section[] = [];
    let currentLine = 0;

    paragraphs.forEach((para, index) => {
      const trimmed = para.trim();
      if (trimmed.length >= minLength) {
        const lineCount = para.split("\n").length;
        sections.push({
          id: `paragraph-${index}`,
          title: `Paragraph ${index + 1}`,
          startLine: currentLine,
          endLine: currentLine + lineCount - 1,
          type: "PARAGRAPH",
        });
        currentLine += lineCount + 1;
      } else {
        currentLine += para.split("\n").length + 1;
      }
    });

    return sections;
  }
}
