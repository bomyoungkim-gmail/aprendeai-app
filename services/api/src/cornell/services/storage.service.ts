import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class StorageService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService
  ) {}

  async getFileViewUrl(fileId: string): Promise<{ url: string; expiresAt: string }> {
    const file = await this.prisma.file.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundException('File not found');

    const provider = this.config.get('STORAGE_PROVIDER', 'LOCAL');

    if (provider === 'LOCAL') {
      return this.getLocalFileUrl(file);
    }

    if (provider === 'S3') {
      return this.getS3SignedUrl(file);
    }

    throw new Error(`Unsupported storage provider: ${provider}`);
  }

  private getLocalFileUrl(file: any) {
    const baseUrl = this.config.get('STORAGE_BASE_URL', 'http://localhost:3000');
    return {
      url: `${baseUrl}/api/files/${file.id}/proxy`,
      expiresAt: new Date(Date.now() + 86400000).toISOString() // 24 hours
    };
  }

  private async getS3SignedUrl(file: any): Promise<{ url: string; expiresAt: string }> {
    // TODO: Implement S3 signed URL generation when needed
    // For now, return placeholder (will throw in production if S3 is used)
    return {
      url: `http://placeholder-s3-url.com/${file.storageKey}`,
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    };
  }

  async streamFile(fileId: string, res: Response) {
    const file = await this.prisma.file.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundException('File not found');

    // Security: prevent path traversal
    const safeKey = path.normalize(file.storageKey).replace(/^(\.\.[\/\\])+/, '');
    
    const uploadPath = this.config.get('STORAGE_LOCAL_PATH', './uploads');
    const filePath = path.join(uploadPath, safeKey);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found on disk');
    }

    // Security: ensure file is within upload directory
    try {
      const realPath = fs.realpathSync(filePath);
      const realUploadPath = fs.realpathSync(uploadPath);
      if (!realPath.startsWith(realUploadPath)) {
        throw new NotFoundException('Invalid file path');
      }
    } catch (error) {
      throw new NotFoundException('File not found or invalid path');
    }

    // Get file stats for Content-Length
    const stats = fs.statSync(filePath);

    // Sanitize filename to prevent header injection
    const sanitizedFilename = this.sanitizeFilename(file.originalFilename);

    // Set headers
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', `inline; filename="${sanitizedFilename}"`);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24h cache

    // Stream file with error handling
    const stream = fs.createReadStream(filePath);
    
    stream.on('error', (error) => {
      console.error('Stream error for file', fileId, ':', error);
      if (!res.headersSent) {
        res.status(500).send('Error streaming file');
      }
    });

    stream.pipe(res);
  }

  private sanitizeFilename(filename: string): string {
    if (!filename) return 'download';
    
    return filename
      .replace(/[^\w\s.-]/g, '_')  // Replace special chars with underscore
      .replace(/\s+/g, '_')         // Replace spaces with underscore
      .replace(/_{2,}/g, '_')       // Replace multiple underscores with single
      .slice(0, 255);               // Limit to 255 chars
  }

  /**
   * Save uploaded file to local storage
   * TODO: For production, migrate to S3 for scalability and redundancy
   * 
   * @param file - Multer file object
   * @returns storageKey - Unique key to identify the file
   */
  async saveFile(file: Express.Multer.File): Promise<string> {
    const uploadPath = this.config.get('STORAGE_LOCAL_PATH', './uploads');

    // Create uploads directory if not exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    // Generate unique filename with timestamp and random string
    const ext = path.extname(file.originalname);
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 10);
    const storageKey = `${timestamp}-${randomStr}${ext}`;
    const filePath = path.join(uploadPath, storageKey);

    // Write file to disk
    await fs.promises.writeFile(filePath, file.buffer);

    return storageKey;
  }

  async getUploadUrl(key: string, contentType: string): Promise<{ url: string; key: string }> {
    // Legacy stub - keeping for backwards compatibility
    const baseUrl = this.config.get('STORAGE_BASE_URL', 'http://localhost:3000');
    return {
      url: `${baseUrl}/api/uploads/${key}`,
      key: key
    };
  }

  async getViewUrl(key: string): Promise<string> {
    // Legacy method - keeping for backwards compatibility
    const baseUrl = this.config.get('STORAGE_BASE_URL', 'http://localhost:3000');
    return `${baseUrl}/api/files/view/${key}`;
  }
}
