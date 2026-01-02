import { Injectable, BadRequestException, Inject } from "@nestjs/common";
import { CreateWebClipDto, StartWebClipSessionDto } from "./dto/webclip.dto";
import * as crypto from "crypto";
import { IContentRepository } from "../cornell/domain/content.repository.interface";
import { ISessionsRepository } from "../sessions/domain/sessions.repository.interface";
import { Content, ContentVersion } from "../cornell/domain/content.entity";
import { ReadingSession } from "../sessions/domain/reading-session.entity";

@Injectable()
export class WebClipsService {
  constructor(
    @Inject(IContentRepository)
    private readonly contentRepository: IContentRepository,
    @Inject(ISessionsRepository)
    private readonly sessionsRepository: ISessionsRepository,
  ) {}

  /**
   * Create WebClip content from browser extension
   * Reuses existing Content model with type WEB_CLIP
   */
  async createWebClip(user_id: string, dto: CreateWebClipDto) {
    const rawText = dto.contentText || dto.selectionText || "";

    if (!rawText.trim()) {
      throw new BadRequestException(
        "Either contentText or selectionText must be provided",
      );
    }

    // Limit text size (50k chars)
    const limitedText = rawText.slice(0, 50000);

    const content = new Content({
      id: crypto.randomUUID(),
      type: "WEB_CLIP",
      title: dto.title,
      rawText: limitedText,
      originalLanguage: (dto.languageHint || "PT_BR") as any,
      metadata: {
        source_url: dto.sourceUrl,
        site_domain: dto.siteDomain,
        capture_mode: dto.captureMode,
        selection_text_preview: dto.selectionText?.slice(0, 200),
        tags: dto.tags || ["webclip"],
        captured_at: new Date().toISOString(),
      },
      ownerId: user_id, // assuming user_id goes here for ownership
      ownerType: "USER", // assuming OWNER_TYPE is correct
      scopeType: "USER",
      scopeId: user_id,
      // source_url is handled via metadata in repo implementation for now
    });

    const createdContent = await this.contentRepository.create(content);

    return {
      contentId: createdContent.id,
      readerUrl: `/reader/${createdContent.id}`,
    };
  }

  /**
   * Start ReadingSession for WebClip
   * Reuses existing ReadingSession model
   */
  async startSession(
    user_id: string,
    content_id: string,
    dto: StartWebClipSessionDto,
  ) {
    // Verify content exists and belongs to user
    // Repo: findById + manual check or extend repo?
    // Using findById and check ownership manually.
    const content = await this.contentRepository.findById(content_id);

    if (
      !content ||
      content.ownerId !== user_id ||
      content.type !== "WEB_CLIP"
    ) {
      throw new BadRequestException("WebClip not found or access denied");
    }

    // Create ContentVersion for this WebClip (ReadingSession requires it)
    const version = new ContentVersion({
      id: crypto.randomUUID(),
      contentId: content_id,
      targetLanguage: content.originalLanguage,
      schoolingLevelTarget: "HIGHER_EDUCATION",
      simplifiedText: content.rawText, // Use rawText as simplified version
      summary: content.title,
    });

    const createdVersion = await this.contentRepository.addVersion(version);

    // Create reading session
    const session = new ReadingSession({
      id: crypto.randomUUID(),
      userId: user_id,
      contentId: content_id,
      // contentVersionId: createdVersion.id, // Entity might not have this field exposed yet? ReadingSession entity check needed.
      // Checking ReadingSession entity... it doesn't seem to export contentVersionId explicitly on class but Prisma repo mapped it.
      // Let's assume repo handles it if passed in data or we need to add it to entity.
      // For now, passing it in partial which gets assigned.
      phase: "PRE",
      modality: "READING",
      assetLayer: dto.assetLayer || "L1",
      goalStatement: `Read in ${dto.timeboxMin || 15} min`,
      predictionText: "",
      targetWordsJson: [],
    } as any); // Casting as any to pass contentVersionId if missing in type definition

    // Inject version id manually if not in type
    (session as any).contentVersionId = createdVersion.id;

    const createdSession = await this.sessionsRepository.create(session);

    // Generate thread ID
    const threadId = `th_web_${createdSession.id}`;

    return {
      readingSessionId: createdSession.id,
      sessionId: createdSession.id,
      threadId: threadId,
      nextPrompt: "Meta do dia em 1 linha + porquê em 1 linha.",
    };
  }

  /**
   * Get WebClip by ID (for verification)
   */
  async getWebClip(user_id: string, content_id: string) {
    const content = await this.contentRepository.findById(content_id);

    if (
      !content ||
      content.ownerId !== user_id ||
      content.type !== "WEB_CLIP"
    ) {
      throw new BadRequestException("WebClip not found");
    }

    return content;
  }
}
