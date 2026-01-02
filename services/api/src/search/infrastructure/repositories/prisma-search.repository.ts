import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ISearchRepository, SearchResult } from '../../domain/interfaces/search.repository.interface';

@Injectable()
export class PrismaSearchRepository implements ISearchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async searchContent(query: string, filters: any): Promise<SearchResult[]> {
    const where: any = {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { raw_text: { contains: query, mode: 'insensitive' } },
      ],
    };

    if (filters.contentType) where.type = filters.contentType;
    if (filters.language) where.original_language = filters.language;
    
    // NEW: Use standardized owner filter if provided
    if (filters.ownerFilter) {
      where.OR = (where.OR || []).concat(filters.ownerFilter);
    } else if (filters.ownerId) {
      where.owner_user_id = filters.ownerId;
    }
    if (filters.startDate || filters.endDate) {
      where.created_at = {};
      if (filters.startDate) where.created_at.gte = new Date(filters.startDate);
      if (filters.endDate) where.created_at.lte = new Date(filters.endDate);
    }

    const contents = await this.prisma.contents.findMany({
      where,
      include: {
        users_owner: { select: { id: true, name: true } },
      },
      take: 50,
    });

    return contents.map((content: any) => ({
      id: content.id,
      type: 'content' as const,
      title: content.title,
      snippet: this.extractSnippet(content.raw_text, query, 150),
      relevance: this.calculateRelevance(content.title, content.raw_text, query),
      metadata: {
        type: content.type,
        language: content.original_language,
        owner: content.users_owner,
      },
      created_at: content.created_at,
    }));
  }

  async searchTranscripts(query: string, userId?: string): Promise<SearchResult[]> {
    const where: any = {
      type: { in: ['VIDEO', 'AUDIO'] as any },
      metadata: {
        path: ['transcription', 'text'],
        string_contains: query,
      },
    };

    if (userId) {
      // Simplified ownership check for transcripts (must own the content)
      where.OR = [
        { owner_user_id: userId },
        { created_by: userId },
        { owner_type: 'USER', owner_id: userId }
      ];
    }

    const contents = await this.prisma.contents.findMany({
      where,
      include: {
        users_owner: { select: { id: true, name: true } },
      },
      take: 50,
    });

    return contents.map((content: any) => {
      const transcription = (content.metadata as any)?.transcription?.text || '';
      return {
        id: content.id,
        type: 'transcript' as const,
        title: `${content.title} (Transcript)`,
        snippet: this.extractSnippet(transcription, query, 150),
        relevance: this.calculateRelevance('', transcription, query),
        metadata: {
          type: content.type,
          owner: content.users_owner,
        },
        created_at: content.created_at,
      };
    });
  }

  async searchAnnotations(userId: string, query: string): Promise<SearchResult[]> {
    const annotations = await this.prisma.annotations.findMany({
      where: {
        user_id: userId,
        OR: [
          { text: { contains: query, mode: 'insensitive' } },
          { selected_text: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        contents: { select: { id: true, title: true } },
        users: { select: { id: true, name: true } },
      },
      take: 50,
    });

    return annotations.map((annotation: any) => ({
      id: annotation.id,
      type: 'annotation' as const,
      title: `Annotation on ${annotation.contents.title}`,
      snippet: this.extractSnippet(
        annotation.text || annotation.selected_text || '',
        query,
        150,
      ),
      relevance: this.calculateRelevance(
        '',
        annotation.text || annotation.selected_text || '',
        query,
      ),
      metadata: {
        contentId: annotation.contents.id,
        contentTitle: annotation.contents.title,
        user: annotation.users,
      },
      created_at: annotation.created_at,
    }));
  }

  async searchNotes(userId: string, query: string): Promise<SearchResult[]> {
    const notes = await this.prisma.cornell_notes.findMany({
      where: {
        user_id: userId,
        OR: [
          { summary_text: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        contents: { select: { id: true, title: true } },
        users: { select: { id: true, name: true } },
      },
      take: 50,
    });

    return notes.map((note: any) => {
      const combinedText = `${note.summary_text}`;
      return {
        id: note.id,
        type: 'note' as const,
        title: `Cornell Note on ${note.contents.title}`,
        snippet: this.extractSnippet(combinedText, query, 150),
        relevance: this.calculateRelevance('', combinedText, query),
        metadata: {
          contentId: note.contents.id,
          contentTitle: note.contents.title,
          user: note.users,
        },
        created_at: note.created_at,
      };
    });
  }

  private extractSnippet(text: string, query: string, length: number): string {
    if (!text) return '';
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const queryIndex = lowerText.indexOf(lowerQuery);

    if (queryIndex === -1) {
      return text.substring(0, length) + (text.length > length ? '...' : '');
    }

    const start = Math.max(0, queryIndex - length / 3);
    const end = Math.min(text.length, queryIndex + query.length + (length * 2) / 3);
    let snippet = text.substring(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';
    return snippet;
  }

  private calculateRelevance(title: string, content: string, query: string): number {
    const lowerQuery = query.toLowerCase();
    const lowerTitle = title.toLowerCase();
    const lowerContent = content.toLowerCase();
    let score = 0;
    if (lowerTitle.includes(lowerQuery)) {
      score += 10;
      if (lowerTitle === lowerQuery) score += 20;
    }
    if (lowerContent.includes(lowerQuery)) {
      score += 5;
      const matches = (lowerContent.match(new RegExp(lowerQuery, 'g')) || []).length;
      score += Math.min(matches, 5);
    }
    return score;
  }
}
