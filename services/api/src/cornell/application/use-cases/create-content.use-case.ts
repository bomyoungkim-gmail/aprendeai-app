import { Injectable, Inject, Logger } from "@nestjs/common";
import { IContentRepository } from "../../domain/content.repository.interface";
import { Content } from "../../domain/content.entity";
import { StorageService } from "../../services/storage.service";
import { VideoService } from "../../../video/video.service";
import { UploadContentDto } from "../../dto/upload-content.dto";
import { v4 as uuidv4 } from "uuid";
import * as path from "path";
import * as mammoth from "mammoth";
import { ContentType } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class CreateContentUseCase {
  private readonly logger = new Logger(CreateContentUseCase.name);

  constructor(
    @Inject(IContentRepository)
    private readonly contentRepository: IContentRepository,
    private readonly storageService: StorageService,
    private readonly videoService: VideoService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    file: Express.Multer.File,
    dto: UploadContentDto,
    userId: string,
  ): Promise<Content> {
    const isVideo = this.videoService.isVideoFile(file.mimetype);
    const isAudio = this.videoService.isAudioFile(file.mimetype);

    // 1. Save file to storage
    const storageKey = await this.storageService.saveFile(file);
    const filePath = path.join("./uploads", storageKey);

    let rawText = "";
    let duration: number | undefined;
    let thumbnailUrl: string | undefined;

    if (isVideo || isAudio) {
      if (isVideo) {
        const metadata = await this.videoService.extractVideoMetadata(filePath);
        duration = metadata.duration;
        try {
          const thumbnailPath =
            await this.videoService.generateThumbnail(filePath);
          thumbnailUrl = `/uploads/thumbnails/${path.basename(thumbnailPath)}`;
        } catch (e) {
          this.logger.warn(`Failed to generate thumbnail: ${e.message}`);
        }
      }
      rawText = "(Transcription Pending)";
    } else {
      // 2. Extract text from document
      try {
        rawText = await this.extractText(file);
      } catch (error) {
        this.logger.error(`Text extraction failed: ${error.message}`);
        rawText = "(Text extraction failed)";
      }
    }

    // 3. Create File record in DB
    const fileRecord = await this.prisma.files.create({
      data: {
        id: uuidv4(),
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        storageKey,
        storageProvider: "LOCAL",
      },
    });

    // 4. Owner Resolution

    // 5. Create Content Entity via Repository
    const content = await this.contentRepository.create({
      id: uuidv4(),
      title: dto.title,
      type: this.getContentType(file.mimetype),
      originalLanguage: dto.originalLanguage,
      rawText,
      scopeType: dto.scopeType,
      scopeId: dto.scopeId,
      file: {
        id: fileRecord.id,
        originalFilename: fileRecord.originalFilename!,
        mimeType: fileRecord.mimeType,
        sizeBytes: Number(fileRecord.sizeBytes),
      },
      metadata: {
        duration,
        thumbnailUrl,
        storageKey,
      },
    });

    return content;
  }

  private async extractText(file: Express.Multer.File): Promise<string> {
    if (file.mimetype === "application/pdf") {
      return this.extractPdfText(file.buffer);
    }
    if (
      file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      return this.extractDocxText(file.buffer);
    }
    if (file.mimetype === "text/plain") {
      return file.buffer.toString("utf-8");
    }
    return "";
  }

  private async extractPdfText(buffer: Buffer): Promise<string> {
    try {
      const { extractText } = await import("unpdf");
      const uint8Array = new Uint8Array(buffer);
      const { text } = await extractText(uint8Array, { mergePages: true });
      return (text || "").replace(/\0/g, "");
    } catch (error) {
      throw new Error(`PDF extraction failed: ${error.message}`);
    }
  }

  private async extractDocxText(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      throw new Error(`DOCX extraction failed: ${error.message}`);
    }
  }

  private getContentType(mimeType: string): ContentType {
    if (mimeType === "application/pdf") return "PDF";
    if (mimeType.includes("wordprocessing")) return "DOCX";
    if (mimeType.startsWith("video/")) return "VIDEO" as ContentType;
    if (mimeType.startsWith("audio/")) return "AUDIO" as ContentType;
    return "PDF";
  }
}
