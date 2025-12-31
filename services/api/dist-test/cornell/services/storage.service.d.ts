import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import { Response } from "express";
export declare class StorageService {
    private prisma;
    private config;
    constructor(prisma: PrismaService, config: ConfigService);
    getFileViewUrl(fileId: string): Promise<{
        url: string;
        expiresAt: string;
    }>;
    private getLocalFileUrl;
    private getS3SignedUrl;
    streamFile(fileId: string, res: Response): Promise<void>;
    private sanitizeFilename;
    saveFile(file: Express.Multer.File): Promise<string>;
    getUploadUrl(key: string, contentType: string): Promise<{
        url: string;
        key: string;
    }>;
    getViewUrl(key: string): Promise<string>;
}
