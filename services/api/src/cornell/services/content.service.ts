import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from './storage.service';
import { UploadContentDto } from '../dto/upload-content.dto';
import { Content, ContentType, Language } from '@prisma/client';
import * as mammoth from 'mammoth';

// Using require for pdf-parse due to TypeScript module resolution issues  
const pdfParse = require('pdf-parse');

@Injectable()
export class ContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Upload a content file (PDF, DOCX, TXT) and extract text
   */
  async uploadContent(
    file: Express.Multer.File,
    dto: UploadContentDto,
    userId: string,
  ): Promise<Content> {
    // 1. Extract text based on file type
    const rawText = await this.extractText(file);

    if (!rawText || rawText.trim().length === 0) {
      throw new BadRequestException('Could not extract text from file');
    }

    // 2. Save file to storage
    const storageKey = await this.storageService.saveFile(file);

    // 3. Create File record
    const fileRecord = await this.prisma.file.create({
      data: {
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        storageKey,
        storageProvider: 'LOCAL', // TODO: Change to 'S3' for production
      },
    });

    // 4. Create Content record
    return this.prisma.content.create({
      data: {
        title: dto.title,
        type: this.getContentType(file.mimetype),
        originalLanguage: dto.originalLanguage,
        rawText,
        fileId: fileRecord.id,
        ownerUserId: userId,
        scopeType: dto.scopeType,
        scopeId: dto.scopeId,
      },
    });
  }

  /**
   * Extract text from file based on mime type
   */
  private async extractText(file: Express.Multer.File): Promise<string> {
    try {
      if (file.mimetype === 'application/pdf') {
        return await this.extractPdfText(file.buffer);
      }
      
      if (
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        return await this.extractDocxText(file.buffer);
      }
      
      if (file.mimetype === 'text/plain') {
        return file.buffer.toString('utf-8');
      }

      throw new BadRequestException('Unsupported file type');
    } catch (error) {
      throw new BadRequestException(`Failed to extract text: ${error.message}`);
    }
  }

  /**
   * Extract text from PDF using pdf-parse
   */
  private async extractPdfText(buffer: Buffer): Promise<string> {
    const pdf = await pdfParse(buffer);
    return pdf.text;
  }

  /**
   * Extract text from DOCX using mammoth
   */
  private async extractDocxText(buffer: Buffer): Promise<string> {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  /**
   * Map MIME type to ContentType enum
   */
  private getContentType(mimeType: string): ContentType {
    if (mimeType === 'application/pdf') return 'PDF';
    if (mimeType.includes('wordprocessing')) return 'DOCX';
    // For plain text, use PDF as default (schema doesn't have TEXT/TXT type)
    return 'PDF';
  }

  /**
   * Search content with PostgreSQL ILIKE
   */
  async searchContent(query: string, filters: {
    type?: ContentType;
    language?: Language;
    page?: number;
    limit?: number;
  }, userId: string) {
    const { type, language, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      ownerUserId: userId,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { rawText: { contains: query, mode: 'insensitive' } },
      ],
    };

    if (type) where.type = type;
    if (language) where.originalLanguage = language;

    // Get total count
    const total = await this.prisma.content.count({ where });

    // Get results
    const contents = await this.prisma.content.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        type: true,
        originalLanguage: true,
        rawText: true,
        createdAt: true,
      },
    });

    // Process results with excerpts
    const results = contents.map(content => ({
      id: content.id,
      title: content.title,
      type: content.type,
      originalLanguage: content.originalLanguage,
      excerpt: this.generateExcerpt(content.rawText, query),
      highlights: this.findHighlights(content.rawText, query),
      createdAt: content.createdAt,
    }));

    return {
      results,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
    };
  }

  /**
   * Generate excerpt around search term
   */
  private generateExcerpt(text: string, query: string, length = 200): string {
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) {
      return text.substring(0, length) + '...';
    }

    // Extract text around the match
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + query.length + 150);
    
    let excerpt = text.substring(start, end);
    if (start > 0) excerpt = '...' + excerpt;
    if (end < text.length) excerpt += '...';
    
    return excerpt;
  }

  /**
   * Find text snippets with highlights
   */
  private findHighlights(text: string, query: string, maxHighlights = 3): string[] {
    const regex = new RegExp(`(.{0,50}${this.escapeRegex(query)}.{0,50})`, 'gi');
    const matches = text.match(regex) || [];
    return matches.slice(0, maxHighlights);
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
