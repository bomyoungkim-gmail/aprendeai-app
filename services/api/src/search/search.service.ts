import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchDto } from './dto/search.dto';

export interface SearchResult {
  id: string;
  type: 'content' | 'annotation' | 'note' | 'transcript';
  title: string;
  snippet: string;
  relevance: number;
  metadata: any;
  createdAt: Date;
}

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  /**
   * Unified search across all content types
   */
  async search(userId: string, dto: SearchDto): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    // Search in different areas based on searchIn filter
    if (!dto.searchIn || dto.searchIn === 'content') {
      const contentResults = await this.searchContent(userId, dto);
      results.push(...contentResults);
    }

    if (!dto.searchIn || dto.searchIn === 'annotation') {
      const annotationResults = await this.searchAnnotations(userId, dto);
      results.push(...annotationResults);
    }

    if (!dto.searchIn || dto.searchIn === 'note') {
      const noteResults = await this.searchNotes(userId, dto);
      results.push(...noteResults);
    }

    if (!dto.searchIn || dto.searchIn === 'transcript') {
      const transcriptResults = await this.searchTranscripts(userId, dto);
      results.push(...transcriptResults);
    }

    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);

    // Apply pagination
    const { offset = 0, limit = 20 } = dto;
    return results.slice(offset, offset + limit);
  }

  /**
   * Search in content (title, rawText)
   */
  private async searchContent(userId: string, dto: SearchDto): Promise<SearchResult[]> {
    const where: any = {
      OR: [
        { title: { contains: dto.query, mode: 'insensitive' } },
        { rawText: { contains: dto.query, mode: 'insensitive' } },
      ],
    };

    // Apply filters
    if (dto.contentType) {
      where.type = dto.contentType;
    }

    if (dto.language) {
      where.originalLanguage = dto.language;
    }

    if (dto.ownerId) {
      where.ownerUserId = dto.ownerId;
    }

    if (dto.startDate || dto.endDate) {
      where.createdAt = {};
      if (dto.startDate) where.createdAt.gte = new Date(dto.startDate);
      if (dto.endDate) where.createdAt.lte = new Date(dto.endDate);
    }

    const contents = await this.prisma.content.findMany({
      where,
      include: {
        ownerUser: { select: { id: true, name: true } },
      },
      take: 50, // Limit before combining
    });

    return contents.map((content: any) => ({
      id: content.id,
      type: 'content' as const,
      title: content.title,
      snippet: this.extractSnippet(content.rawText, dto.query, 150),
      relevance: this.calculateRelevance(content.title, content.rawText, dto.query),
      metadata: {
        type: content.type,
        language: content.originalLanguage,
        owner: content.ownerUser,
      },
      createdAt: content.createdAt,
    }));
  }

  /**
   * Search in video/audio transcripts
   */
  private async searchTranscripts(userId: string, dto: SearchDto): Promise<SearchResult[]> {
    const contents = await this.prisma.content.findMany({
      where: {
        type: { in: ['VIDEO', 'AUDIO'] as any }, // Cast to any to avoid Enum issues
        metadata: {
          path: ['transcription', 'text'],
          string_contains: dto.query,
        },
      },
      include: {
        ownerUser: { select: { id: true, name: true } },
      },
      take: 50,
    });

    return contents.map((content: any) => {
      const transcription = (content.metadata as any)?.transcription?.text || '';
      
      return {
        id: content.id,
        type: 'transcript' as const,
        title: `${content.title} (Transcript)`,
        snippet: this.extractSnippet(transcription, dto.query, 150),
        relevance: this.calculateRelevance('', transcription, dto.query),
        metadata: {
          type: content.type,
          owner: content.ownerUser,
        },
        createdAt: content.createdAt,
      };
    });
  }

  /**
   * Search in annotations
   */
  private async searchAnnotations(userId: string, dto: SearchDto): Promise<SearchResult[]> {
    const annotations = await this.prisma.annotation.findMany({
      where: {
        userId,
        OR: [
          { text: { contains: dto.query, mode: 'insensitive' } },
          { selectedText: { contains: dto.query, mode: 'insensitive' } },
        ],
      },
      include: {
        content: { select: { id: true, title: true } },
        user: { select: { id: true, name: true } },
      },
      take: 50,
    });

    return annotations.map((annotation) => ({
      id: annotation.id,
      type: 'annotation' as const,
      title: `Annotation on ${annotation.content.title}`,
      snippet: this.extractSnippet(
        annotation.text || annotation.selectedText || '',
        dto.query,
        150
      ),
      relevance: this.calculateRelevance(
        '',
        annotation.text || annotation.selectedText || '',
        dto.query
      ),
      metadata: {
        contentId: annotation.content.id,
        contentTitle: annotation.content.title,
        user: annotation.user,
      },
      createdAt: annotation.createdAt,
    }));
  }

  /**
   * Search in Cornell notes
   */
  private async searchNotes(userId: string, dto: SearchDto): Promise<SearchResult[]> {
    const notes = await this.prisma.cornellNotes.findMany({
      where: {
        userId,
        OR: [
          // JSON search is complex in Prisma, limiting search to summaryText for MVP
          // { cuesJson: { string_contains: dto.query } }, 
          { summaryText: { contains: dto.query, mode: 'insensitive' } },
        ],
      },
      include: {
        content: { select: { id: true, title: true } },
        user: { select: { id: true, name: true } },
      },
      take: 50,
    });

    return notes.map((note: any) => {
      const cuesText = JSON.stringify(note.cuesJson || []);
      const notesText = JSON.stringify(note.notesJson || []);
      const combinedText = `${cuesText} ${notesText} ${note.summaryText}`;
      
      return {
        id: note.id,
        type: 'note' as const,
        title: `Cornell Note on ${note.content.title}`,
        snippet: this.extractSnippet(combinedText, dto.query, 150),
        relevance: this.calculateRelevance('', combinedText, dto.query),
        metadata: {
          contentId: note.content.id,
          contentTitle: note.content.title,
          user: note.user,
        },
        createdAt: note.createdAt,
      };
    });
  }

  /**
   * Extract snippet with query context
   */
  private extractSnippet(text: string, query: string, length: number): string {
    if (!text) return '';

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const queryIndex = lowerText.indexOf(lowerQuery);

    if (queryIndex === -1) {
      // Query not found, return beginning
      return text.substring(0, length) + (text.length > length ? '...' : '');
    }

    // Extract around query
    const start = Math.max(0, queryIndex - length / 3);
    const end = Math.min(text.length, queryIndex + query.length + (length * 2) / 3);

    let snippet = text.substring(start, end);
    
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';

    return snippet;
  }

  /**
   * Calculate relevance score
   */
  private calculateRelevance(title: string, content: string, query: string): number {
    const lowerQuery = query.toLowerCase();
    const lowerTitle = title.toLowerCase();
    const lowerContent = content.toLowerCase();

    let score = 0;

    // Title match = high relevance
    if (lowerTitle.includes(lowerQuery)) {
      score += 10;
      // Exact title match = even higher
      if (lowerTitle === lowerQuery) {
        score += 20;
      }
    }

    // Content match
    if (lowerContent.includes(lowerQuery)) {
      score += 5;
      
      // Count occurrences (up to 5)
      const matches = (lowerContent.match(new RegExp(lowerQuery, 'g')) || []).length;
      score += Math.min(matches, 5);
    }

    return score;
  }
}
