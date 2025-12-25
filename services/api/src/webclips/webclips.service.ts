import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateWebClipDto, StartWebClipSessionDto } from "./dto/webclip.dto";

@Injectable()
export class WebClipsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create WebClip content from browser extension
   * Reuses existing Content model with type WEB_CLIP
   */
  async createWebClip(userId: string, dto: CreateWebClipDto) {
    const rawText = dto.contentText || dto.selectionText || "";

    if (!rawText.trim()) {
      throw new BadRequestException(
        "Either contentText or selectionText must be provided",
      );
    }

    // Limit text size (50k chars)
    const limitedText = rawText.slice(0, 50000);

    const content = await this.prisma.content.create({
      data: {
        type: "WEB_CLIP",
        title: dto.title,
        rawText: limitedText,
        originalLanguage: dto.languageHint || "PT_BR", // Fixed: Use PT_BR not PT
        metadata: {
          sourceUrl: dto.sourceUrl,
          siteDomain: dto.siteDomain,
          captureMode: dto.captureMode,
          selectionTextPreview: dto.selectionText?.slice(0, 200),
          tags: dto.tags || ["webclip"],
          capturedAt: new Date().toISOString(),
        },
        creator: { connect: { id: userId } }, // Fixed: Use relation instead of createdBy
        scopeType: "USER",
        // status: 'ACTIVE', // Removed: doesn't exist in Content model
      },
    });

    return {
      contentId: content.id,
      readerUrl: `/reader/${content.id}`,
    };
  }

  /**
   * Start ReadingSession for WebClip
   * Reuses existing ReadingSession model
   */
  async startSession(
    userId: string,
    contentId: string,
    dto: StartWebClipSessionDto,
  ) {
    // Verify content exists and belongs to user
    const content = await this.prisma.content.findFirst({
      where: {
        id: contentId,
        createdBy: userId,
        type: "WEB_CLIP",
      },
    });

    if (!content) {
      throw new BadRequestException("WebClip not found or access denied");
    }

    // Create ContentVersion for this WebClip (ReadingSession requires it)
    const version = await this.prisma.contentVersion.create({
      data: {
        contentId,
        targetLanguage: content.originalLanguage,
        schoolingLevelTarget: "HIGHER_EDUCATION",
        simplifiedText: content.rawText, // Use rawText as simplified version
        summary: content.title,
      },
    });

    // Create reading session
    const session = await this.prisma.readingSession.create({
      data: {
        userId,
        contentId,
        contentVersionId: version.id, // Use ContentVersion ID
        phase: "PRE",
        modality: "READING",
        assetLayer: dto.assetLayer || "L1",
        goalStatement: `Read in ${dto.timeboxMin || 15} min`,
        predictionText: "",
        targetWordsJson: [],
      },
    });

    // Generate thread ID
    const threadId = `th_web_${session.id}`;

    return {
      readingSessionId: session.id,
      sessionId: session.id,
      threadId,
      nextPrompt: "Meta do dia em 1 linha + porquê em 1 linha.",
    };
  }

  /**
   * Get WebClip by ID (for verification)
   */
  async getWebClip(userId: string, contentId: string) {
    const content = await this.prisma.content.findFirst({
      where: {
        id: contentId,
        createdBy: userId,
        type: "WEB_CLIP",
      },
    });

    if (!content) {
      throw new BadRequestException("WebClip not found");
    }

    return content;
  }
}
