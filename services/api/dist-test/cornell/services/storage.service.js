"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const path = require("path");
const fs = require("fs");
const urls_config_1 = require("../../config/urls.config");
let StorageService = class StorageService {
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
    }
    async getFileViewUrl(fileId) {
        const file = await this.prisma.files.findUnique({ where: { id: fileId } });
        if (!file)
            throw new common_1.NotFoundException("File not found");
        const provider = this.config.get("STORAGE_PROVIDER", "LOCAL");
        if (provider === "LOCAL") {
            return this.getLocalFileUrl(file);
        }
        if (provider === "S3") {
            return this.getS3SignedUrl(file);
        }
        throw new Error(`Unsupported storage provider: ${provider}`);
    }
    getLocalFileUrl(file) {
        const baseUrl = this.config.get("STORAGE_BASE_URL") || urls_config_1.URL_CONFIG.storage.base;
        return {
            url: `${baseUrl}/api/files/${file.id}/proxy`,
            expiresAt: new Date(Date.now() + 86400000).toISOString(),
        };
    }
    async getS3SignedUrl(file) {
        const baseUrl = this.config.get("STORAGE_S3_CUSTOM_DOMAIN") ||
            `https://${this.config.get("STORAGE_S3_BUCKET")}.s3.amazonaws.com`;
        return {
            url: `${baseUrl}/${file.storageKey}`,
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
        };
    }
    async streamFile(fileId, res) {
        console.log(`[StorageService] Streaming file: ${fileId}`);
        const file = await this.prisma.files.findUnique({ where: { id: fileId } });
        if (!file) {
            console.error(`[StorageService] File record not found in DB: ${fileId}`);
            throw new common_1.NotFoundException("File not found");
        }
        const safeKey = path
            .normalize(file.storageKey)
            .replace(/^(\.\.[\/\\])+/, "");
        const uploadPath = this.config.get("STORAGE_LOCAL_PATH", "./uploads");
        const filePath = path.join(uploadPath, safeKey);
        console.log(`[StorageService] Resolved path: ${filePath}`);
        console.log(`[StorageService] Absolute path: ${path.resolve(filePath)}`);
        if (!fs.existsSync(filePath)) {
            console.error(`[StorageService] File NOT found on disk: ${filePath}`);
            throw new common_1.NotFoundException("File not found on disk");
        }
        try {
            const realPath = fs.realpathSync(filePath);
            const realUploadPath = fs.realpathSync(uploadPath);
            if (!realPath.startsWith(realUploadPath)) {
                throw new common_1.NotFoundException("Invalid file path");
            }
        }
        catch (error) {
            throw new common_1.NotFoundException("File not found or invalid path");
        }
        const stats = fs.statSync(filePath);
        const sanitizedFilename = this.sanitizeFilename(file.originalFilename);
        res.setHeader("Content-Type", file.mimeType);
        res.setHeader("Content-Length", stats.size);
        res.setHeader("Content-Disposition", `inline; filename="${sanitizedFilename}"`);
        res.setHeader("Cache-Control", "public, max-age=86400");
        const stream = fs.createReadStream(filePath);
        stream.on("error", (error) => {
            console.error("Stream error for file", fileId, ":", error);
            if (!res.headersSent) {
                res.status(500).send("Error streaming file");
            }
        });
        stream.pipe(res);
    }
    sanitizeFilename(filename) {
        if (!filename)
            return "download";
        return filename
            .replace(/[^\w\s.-]/g, "_")
            .replace(/\s+/g, "_")
            .replace(/_{2,}/g, "_")
            .slice(0, 255);
    }
    async saveFile(file) {
        const uploadPath = this.config.get("STORAGE_LOCAL_PATH", "./uploads");
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        const ext = path.extname(file.originalname);
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 10);
        const storageKey = `${timestamp}-${randomStr}${ext}`;
        const filePath = path.join(uploadPath, storageKey);
        await fs.promises.writeFile(filePath, file.buffer);
        return storageKey;
    }
    async getUploadUrl(key, contentType) {
        const baseUrl = urls_config_1.URL_CONFIG.storage.base;
        return {
            url: `${baseUrl}/api/uploads/${key}`,
            key: key,
        };
    }
    async getViewUrl(key) {
        const baseUrl = urls_config_1.URL_CONFIG.storage.base;
        return `${baseUrl}/api/files/view/${key}`;
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], StorageService);
//# sourceMappingURL=storage.service.js.map