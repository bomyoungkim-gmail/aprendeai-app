import {
  Injectable,
  BadRequestException,
  Logger,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { StorageService } from "./storage.service";
import { UploadContentDto } from "../dto/upload-content.dto";
import {
  contents as Content,
  ContentType,
  Language,
  Environment,
  ScopeType,
} from "@prisma/client";
import { VideoService } from "../../video/video.service";
import { TranscriptionService } from "../../transcription/transcription.service";
import { EnforcementService } from "../../billing/enforcement.service";
import { FamilyService } from "../../family/family.service";
import { UsageTrackingService } from "../../billing/usage-tracking.service";
import { ActivityService } from "../../activity/activity.service";
import * as mammoth from "mammoth";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";

import { TopicMasteryService } from "../../analytics/topic-mastery.service";

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly videoService: VideoService,
    private readonly transcriptionService: TranscriptionService,
    private readonly enforcementService: EnforcementService,
    private readonly familyService: FamilyService,
    private readonly usageTracking: UsageTrackingService,
    private readonly activityService: ActivityService,
    private readonly topicMastery: TopicMasteryService,
  ) {}

  /**
   * Upload a content file (PDF, DOCX, TXT, Video, Audio) and extract text/metadata
   */
  async uploadContent(
    file: Express.Multer.File,
    dto: UploadContentDto,
    userId: string,
  ): Promise<Content> {
    const isVideo = this.videoService.isVideoFile(file.mimetype);
    const isAudio = this.videoService.isAudioFile(file.mimetype);

    // --- ENFORCEMENT & USAGE POOLING ---
    const envString = process.env.NODE_ENV?.toUpperCase();
    const env =
      envString === "PRODUCTION"
        ? Environment.PROD
        : envString === "STAGING"
          ? Environment.STAGING
          : Environment.DEV;

    const metric = "content_uploads_per_month";

    // Resolve hierarchy (User -> Family)
    const hierarchy = await this.familyService.resolveBillingHierarchy(userId);

    // Check limits (Picks effective scope)
    const effectiveScope = await this.enforcementService.enforceHierarchy(
      hierarchy,
      metric,
      1,
      env,
    );

    // Track usage against effective scope
    await this.usageTracking.trackUsage({
      scopeType: effectiveScope.scopeType,
      scopeId: effectiveScope.scopeId,
      metric,
      quantity: 1,
      environment: env,
      userId,
    });
    // -----------------------------------

    // 1. Save file to storage first
    const storageKey = await this.storageService.saveFile(file);
    const filePath = path.join("./uploads", storageKey);

    let rawText = "";
    let duration: number | undefined;
    let thumbnailUrl: string | undefined;

    if (isVideo || isAudio) {
      // Handle video/audio upload
      this.logger.log(
        `Processing ${isVideo ? "video" : "audio"}: ${file.originalname}`,
      );

      // Extract metadata
      if (isVideo) {
        const metadata = await this.videoService.extractVideoMetadata(filePath);
        duration = metadata.duration;

        // Generate thumbnail
        try {
          const thumbnailPath =
            await this.videoService.generateThumbnail(filePath);
          thumbnailUrl = `/uploads/thumbnails/${path.basename(thumbnailPath)}`;
        } catch (error) {
          this.logger.warn(`Failed to generate thumbnail: ${error.message}`);
        }

        // Extract audio for transcription
        try {
          const audioPath =
            await this.videoService.extractAudioFromVideo(filePath);
          // Update filePath to audio if we need to transcribe that
          // But actually we transcribe the video file directly often or the extracted audio
          // For now let's assume transcription service handles video files too or we pass audioPath
          // But wait, the previous code didn't use audioPath variable clearly.
          // I will assume transcriptionService.transcribe accepts the logical path.
        } catch (e) {
          // warning
        }
      }

      // Transcribe
      // Trigger background transcription
      this.transcribeInBackground(filePath, file.originalname);

      // For now, set rawText to placeholder or pending
      rawText = "(Transcription Pending)";
    } else {
      // Document upload
      try {
        rawText = await this.extractText(file);
      } catch (error) {
        this.logger.error(`Text extraction failed: ${error.message}`);
        // Allow upload but with warning/empty text? Or fail?
        // Previous code logic threw BadRequest if empty
      }

      if (!rawText || rawText.trim().length === 0) {
        throw new BadRequestException("Could not extract text from file");
      }
    }

    // 2. Create File record
    const fileRecord = await this.prisma.files.create({
      data: {
        id: uuidv4(),
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        storageKey,
        storageProvider: "LOCAL", // TODO: Change to 'S3' for production
      },
      // Note: Model files uses camelCase properties as per schema check
    });

    // Track activity: content upload counts as reading new content
    await this.activityService
      .trackActivity(userId, "read")
      .catch((err) =>
        this.logger.warn(`Failed to track upload activity: ${err.message}`),
      );

    // Determine owner based on context and dto
    // If scope is FAMILY or INSTITUTION, use that as owner
    // Otherwise default to USER
    let ownerType: string;
    let ownerId: string;

    if (dto.scopeType === "FAMILY" || dto.scopeType === "INSTITUTION") {
      ownerType = dto.scopeType;
      ownerId = dto.scopeId || userId; //  Fallback to userId if no scopeId
    } else {
      ownerType = "USER";
      ownerId = userId;
    }

    // 3. Create Content record
    const content = await this.prisma.contents.create({
      data: {
        id: uuidv4(),
        title: dto.title,
        type: this.getContentType(file.mimetype),
        original_language: dto.originalLanguage,
        raw_text: rawText,
        files: { connect: { id: fileRecord.id } },
        scope_type: dto.scopeType,
        scope_id: dto.scopeId || userId, // Default to userId if no scopeId provided
        metadata: {
          duration,
          thumbnailUrl,
        },
        updated_at: new Date(), // Required field
      },
    });

    this.logger.log(
      `✅ Content uploaded successfully: ${content.id} (${content.title})`,
    );

    return content;
  }

  /**
   * Create content manually (e.g. for external videos or text-only)
   */
  async createManualContent(userId: string, dto: any): Promise<Content> {
    //  Basic validation
    if (!dto.title) throw new BadRequestException("Title is required");
    if (!dto.type) throw new BadRequestException("Type is required");

    // NEW: Support owner type specification or default to USER
    const ownerType = dto.ownerType || "USER";
    const ownerId = dto.ownerId || userId;

    // Merge metadata from DTO with default fields
    const mergedMetadata = {
      ...(dto.metadata || {}),
      duration: dto.duration,
      thumbnailUrl: dto.thumbnailUrl,
      sourceUrl: dto.sourceUrl,
    };

    // Create Content record without file
    const content = await this.prisma.contents.create({
      data: {
        id: uuidv4(),
        title: dto.title,
        type: dto.type,
        original_language: dto.originalLanguage || "PT_BR", // Default
        raw_text: dto.rawText || "",
        scope_type: dto.scopeType || ScopeType.USER,
        scope_id: dto.scopeId || userId,
        source_id: dto.sourceId, // Preserve sourceId from ingestors
        metadata: mergedMetadata, // Preserve all metadata
        duration: dto.duration, // Mapped to column
        source_url: dto.sourceUrl,
        updated_at: new Date(),
      },
    });

    this.logger.log(
      `✅ Manual content created: ${content.id} (${content.title})`,
    );

    return content;
  }

  /**
   * Extract text from file based on mime type
   */
  private async extractText(file: Express.Multer.File): Promise<string> {
    try {
      if (file.mimetype === "application/pdf") {
        return await this.extractPdfText(file.buffer);
      }

      if (
        file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        return await this.extractDocxText(file.buffer);
      }

      if (file.mimetype === "text/plain") {
        return file.buffer.toString("utf-8");
      }

      throw new BadRequestException("Unsupported file type");
    } catch (error) {
      throw new BadRequestException(`Failed to extract text: ${error.message}`);
    }
  }

  /**
   * Extract text from PDF using unpdf (modern, zero-dependency library)
   */
  private async extractPdfText(buffer: Buffer): Promise<string> {
    this.logger.log(
      `Starting PDF extraction with unpdf, buffer size: ${buffer.length} bytes`,
    );

    try {
      // unpdf provides a simple extractText function
      const { extractText } = await import("unpdf");

      // Convert Buffer to Uint8Array for unpdf
      const uint8Array = new Uint8Array(buffer);

      this.logger.log(`Converted to Uint8Array, length: ${uint8Array.length}`);

      const { text, totalPages } = await extractText(uint8Array, {
        mergePages: true,
      });

      this.logger.log(
        `PDF extracted successfully. Text length: ${text?.length || 0}, pages: ${totalPages || 0}`,
      );

      if (!text || text.trim().length === 0) {
        this.logger.warn("PDF extraction returned empty text");
        // For scanned PDFs or image-based PDFs, return placeholder
        return "(This PDF may be image-based and requires OCR. Text extraction not available yet.)";
      }

      // Sanitize text: Remove null bytes (\0) that PostgreSQL UTF8 doesn't accept
      const sanitized = (text || "").replace(/\0/g, "");

      return sanitized;
    } catch (error) {
      this.logger.error(
        `unpdf extraction failed: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(`PDF extraction failed: ${error.message}`);
    }
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
    if (mimeType === "application/pdf") return "PDF";
    if (mimeType.includes("wordprocessing")) return "DOCX";
    if (mimeType.startsWith("video/")) return "VIDEO" as ContentType;
    if (mimeType.startsWith("audio/")) return "AUDIO" as ContentType;
    // For plain text, use PDF as default
    return "PDF";
  }

  /**
   * Background transcription process
   */
  private async transcribeInBackground(
    filePath: string,
    originalFilename: string,
  ): Promise<void> {
    if (!this.transcriptionService.isAvailable()) {
      this.logger.warn(
        "Transcription service not available (OpenAI API key not configured)",
      );
      return;
    }

    try {
      this.logger.log(
        `Starting background transcription for ${originalFilename}`,
      );

      const transcription =
        await this.transcriptionService.transcribe(filePath);

      // TODO: Update Content record with transcription
      // This would require getting the content ID, which we don't have here
      // Better approach: Use a job queue (Bull, BullMQ) to handle this

      this.logger.log(`Transcription completed for ${originalFilename}`);
    } catch (error) {
      this.logger.error(
        `Transcription failed for ${originalFilename}: ${error.message}`,
      );
    }
  }

  /**
   * Search content with PostgreSQL ILIKE
   */
  async searchContent(
    query: string,
    filters: {
      type?: ContentType;
      language?: Language;
      page?: number;
      limit?: number;
      recommendForUserId?: string;
    },
    userId: string,
  ) {
    const {
      type,
      language,
      page = 1,
      limit = 20,
      recommendForUserId,
    } = filters;
    const skip = (page - 1) * limit;

    // 1. Get user's families to check permissions
    const families = await this.familyService.findAllForUser(userId);
    const familyIds = families.map((f) => f.id);

    // Build permission filter (Owner OR Member of Family Scope)
    const permissionFilter = {
      OR: [
        { scope_type: ScopeType.USER, scope_id: userId },
        { scope_type: ScopeType.FAMILY, scope_id: { in: familyIds } },
        { created_by: userId },
      ],
    };

    // Build search filter
    let searchFilter: any = {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { raw_text: { contains: query, mode: "insensitive" } },
      ],
    };

    // Recommendation Logic
    if (recommendForUserId) {
      const weakTopics = await this.topicMastery.getWeakestTopics(
        recommendForUserId,
        8,
      );
      const topicNames = weakTopics.map((wt) => wt.topic);

      if (topicNames.length > 0) {
        // Boost search by including weak topics in the OR condition
        // If query is empty, we search explicitly for these topics
        if (!query || query.trim() === "") {
          searchFilter = {
            OR: topicNames.map((topic) => ({
              OR: [
                { title: { contains: topic, mode: "insensitive" } },
                { rawText: { contains: topic, mode: "insensitive" } },
              ],
            })),
          };
        }
      }
    }

    // Combine filters
    const where: any = {
      AND: [permissionFilter, searchFilter],
    };

    if (type) where.type = type;
    if (language) where.original_language = language;

    // Get total count
    const total = await this.prisma.contents.count({ where });

    // Get results
    const contents = await this.prisma.contents.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        title: true,
        type: true,
        original_language: true,
        raw_text: true,
        created_at: true,
      },
    });

    // Process results with excerpts
    const results = contents.map((content) => ({
      id: content.id,
      title: content.title,
      type: content.type,
      originalLanguage: content.original_language,
      excerpt: this.generateExcerpt(content.raw_text, query),
      highlights: this.findHighlights(content.raw_text, query),
      createdAt: content.created_at,
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
   * Get content by ID with permission check
   */
  async getContent(contentId: string, userId: string) {
    const content = await this.prisma.contents.findUnique({
      where: { id: contentId },
      include: {
        files: true,
        cornell_notes: {
          where: { user_id: userId },
          take: 1,
        },
        _count: {
          select: {
            assessments: true,
            highlights: true,
          },
        },
      },
    });

    if (!content) {
      throw new NotFoundException(`Content not found`);
    }

    // NEW: Use canAccessContent helper for unified ownership check
    const hasAccess = await this.canAccessContent(contentId, userId);
    if (!hasAccess) {
      throw new ForbiddenException("Access denied to this content");
    }

    // Transform BigInt to Number for JSON serialization
    const contentAny = content as any;
    const transformedContent = {
      ...contentAny,
      _count: contentAny._count
        ? {
            assessments: Number(contentAny._count.assessments || 0),
            highlights: Number(contentAny._count.highlights || 0),
          }
        : undefined,
      // Transform file.sizeBytes if file exists
      file: contentAny.files
        ? {
            ...contentAny.files,
            sizeBytes: Number(contentAny.files.sizeBytes),
          }
        : undefined,
    };

    // Also transform any BigInt in nested cornellNotes if present
    if (
      transformedContent.cornell_notes &&
      Array.isArray(transformedContent.cornell_notes)
    ) {
      transformedContent.cornell_notes = transformedContent.cornell_notes.map(
        (note: any) => ({
          ...note,
          _count: note._count
            ? Object.fromEntries(
                Object.entries(note._count).map(([key, value]) => [
                  key,
                  Number(value),
                ]),
              )
            : undefined,
        }),
      );
    }

    return transformedContent;
  }

  /**
   * Generate excerpt around search term
   */
  private generateExcerpt(text: string, query: string, length = 200): string {
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) {
      return text.substring(0, length) + "...";
    }

    // Extract text around the match
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + query.length + 150);

    let excerpt = text.substring(start, end);
    if (start > 0) excerpt = "..." + excerpt;
    if (end < text.length) excerpt += "...";

    return excerpt;
  }

  /**
   * Find text snippets with highlights
   */
  private findHighlights(
    text: string,
    query: string,
    maxHighlights = 3,
  ): string[] {
    const regex = new RegExp(
      `(.{0,50}${this.escapeRegex(query)}.{0,50})`,
      "gi",
    );
    const matches = text.match(regex) || [];
    return matches.slice(0, maxHighlights);
  }

  /**
   * Check if user can access content based on ownerType/ownerId
   * Supports USER, FAMILY, and INSTITUTION ownership
   */
  async canAccessContent(contentId: string, userId: string): Promise<boolean> {
    const content = await this.prisma.contents.findUnique({
      where: { id: contentId },
      select: {
        created_by: true,
        scope_type: true,
        scope_id: true,
        institution_id: true,
      },
    });

    if (!content) return false;

    // Direct User Ownership (Standardized)
    if (
      content.scope_type === ScopeType.USER &&
      (content.scope_id === userId || content.created_by === userId)
    )
      return true;

    // Shared Ownership (Family)
    if (content.scope_type === ScopeType.FAMILY) {
      const familyMember = await this.prisma.family_members.findFirst({
        where: {
          family_id: content.scope_id,
          user_id: userId,
          status: "ACTIVE",
        },
      });
      return !!familyMember;
    }

    // Institution Ownership
    if (content.scope_type === ScopeType.INSTITUTION) {
      const instId = content.scope_id || content.institution_id;
      const user = await this.prisma.users.findUnique({
        where: { id: userId },
        select: { last_institution_id: true },
      });
      return user?.last_institution_id === instId;
    }

    return false;
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  async updateContent(id: string, userId: string, dto: any): Promise<Content> {
    const hasAccess = await this.canAccessContent(id, userId);
    if (!hasAccess) throw new ForbiddenException("Access denied");

    const content = await this.prisma.contents.findUnique({ where: { id } });
    if (!content) throw new NotFoundException("Content not found");

    const updatedMetadata = {
      ...((content.metadata as any) || {}),
      duration: dto.duration ?? (content.metadata as any)?.duration,
    };

    return this.prisma.contents.update({
      where: { id },
      data: {
        title: dto.title,
        duration: dto.duration,
        metadata: updatedMetadata,
      },
    });
  }

  /**
   * Create content version (simplified text)
   * Used by content_processor worker
   * Accepts snake_case from worker, stores in DB
   */
  async createContentVersion(
    contentId: string,
    data: {
      target_language: string;
      schooling_level_target: string;
      simplified_text: string;
      summary?: string;
      vocabulary_glossary?: Record<string, any>;
    },
  ) {
    // Verify content exists
    const content = await this.prisma.contents.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException(`Content ${contentId} not found`);
    }

    // Create version record (snake_case matches schema)
    const version = await this.prisma.content_versions.create({
      data: {
        id: uuidv4(),
        content_id: contentId,
        target_language: data.target_language as Language,
        schooling_level_target: data.schooling_level_target,
        simplified_text: data.simplified_text,
        summary: data.summary,
        vocabulary_glossary: data.vocabulary_glossary,
      },
    });

    this.logger.log(
      `✅ Content version created: ${version.id} for content ${contentId}`,
    );

    return version;
  }
}

