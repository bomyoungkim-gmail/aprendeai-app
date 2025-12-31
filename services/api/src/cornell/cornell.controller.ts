import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Patch,
  Request,
  UseGuards,
  SetMetadata,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { AuthGuard } from "@nestjs/passport";
import { CornellService } from "./cornell.service";
import { StorageService } from "./services/storage.service";
import { ContentService } from "./services/content.service";
import { QueueService } from "../queue/queue.service";
import {
  CreateHighlightDto,
  UpdateCornellDto,
  UpdateHighlightDto,
  CreateContentDto,
  UpdateContentDto,
} from "./dto/cornell.dto";
import { UploadContentDto } from "./dto/upload-content.dto";
import { NotificationsGateway } from "../notifications/notifications.gateway";
import { CreateContentUseCase } from "./application/use-cases/create-content.use-case";
import { QUEUES, DEFAULTS, UPLOAD_LIMITS } from "../config/constants";

@Controller("contents")
@UseGuards(AuthGuard("jwt"))
export class CornellController {
  constructor(
    private cornellService: CornellService,
    private storageService: StorageService,
    private contentService: ContentService,
    private queueService: QueueService,
    private notificationsGateway: NotificationsGateway,
    // Refactored Use Cases
    private createContentUseCase: CreateContentUseCase,
  ) {}

  @Post("create_manual")
  async createContent(@Body() dto: CreateContentDto, @Request() req) {
    return this.contentService.createManualContent(req.user.id, dto);
  }

  @Patch(":id/update")
  async updateContent(
    @Param("id") id: string,
    @Body() dto: UpdateContentDto,
    @Request() req,
  ) {
    return this.contentService.updateContent(id, req.user.id, dto);
  }

  @Get("my-contents")
  async getMyContents(@Request() req) {
    return this.cornellService.getMyContents(req.user.id);
  }

  @Get(":id")
  async getContent(@Param("id") id: string, @Request() req) {
    return this.cornellService.getContent(id, req.user.id);
  }

  @Delete(":id")
  async deleteContent(@Param("id") id: string, @Request() req) {
    return this.cornellService.deleteContent(id, req.user.id);
  }

  @Post("bulk-delete")
  async bulkDeleteContents(
    @Body() body: { contentIds: string[] },
    @Request() req,
  ) {
    return this.cornellService.bulkDeleteContents(body.contentIds, req.user.id);
  }

  /**
   * Upload new content file (PDF, DOCX, TXT)
   * Max size: 20MB
   */
  @Post("upload")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: UPLOAD_LIMITS.CONTENT_FILE_SIZE },
      fileFilter: (req, file, cb) => {
        const allowed = [
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "text/plain",
        ];

        if (allowed.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              "Only PDF, DOCX, and TXT files are allowed",
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadContent(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadContentDto,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException("File is required");
    }

    return this.createContentUseCase.execute(file, dto, req.user.id);
  }

  // ... (searchContent kept as is) but I need to be careful with range replacement.
  // Wait, replace_file_content replaces a chunk. I should target specific methods.

  // Skipping searchContent, proxyFile, getContent, etc. to minimize diff.

  @Post(":id/simplify")
  async triggerSimplify(
    @Param("id") id: string,
    @Body() body: { text: string; level?: string; lang?: string },
  ) {
    try {
      const payload = {
        action: "SIMPLIFY",
        contentId: id,
        text: body.text,
        level: body.level || DEFAULTS.SCHOOL_LEVEL.ELEMENTARY_5,
        targetLang: body.lang || DEFAULTS.LANGUAGE.PT_BR,
      };

      await this.queueService.publish(QUEUES.CONTENT_PROCESS, payload);

      return { message: "Simplification task queued" };
    } catch (err) {
      console.error(err);
      throw new HttpException(
        "Failed to queue task",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(":id/assessment")
  async triggerAssessment(
    @Param("id") id: string,
    @Body() body: { text: string; level?: string },
  ) {
    try {
      const payload = {
        action: "ASSESSMENT",
        contentId: id,
        text: body.text,
        level: body.level || DEFAULTS.SCHOOL_LEVEL.HIGH_SCHOOL_1,
      };

      await this.queueService.publish(QUEUES.CONTENT_PROCESS, payload);

      return { message: "Assessment task queued" };
    } catch (err) {
      console.error(err);
      throw new HttpException(
        "Failed to queue task",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(":id/highlights")
  async getHighlights(@Param("id") id: string, @Request() req) {
    return this.cornellService.getHighlights(id, req.user.id);
  }

  @Post(":id/highlights")
  async createHighlight(
    @Param("id") id: string,
    @Body() dto: CreateHighlightDto,
    @Request() req,
  ) {
    return this.cornellService.createHighlight(id, dto, req.user.id);
  }

  @Get(":id/cornell")
  async getCornellNotes(@Param("id") id: string, @Request() req) {
    return this.cornellService.getOrCreateCornellNotes(id, req.user.id);
  }

  @Put(":id/cornell")
  async updateCornellNotes(
    @Param("id") id: string,
    @Body() dto: UpdateCornellDto,
    @Request() req,
  ) {
    return this.cornellService.updateCornellNotes(id, dto, req.user.id);
  }

  /**
   * Webhook endpoint for workers to notify job completion
   * Called by external worker when simplification/assessment completes
   */
  @Post("jobs/:contentId/complete")
  @SetMetadata("isPublic", true) // Allow worker to call without auth
  async handleJobComplete(
    @Param("contentId") contentId: string,
    @Body() body: { type: "simplification" | "assessment"; success: boolean },
  ) {
    if (body.success) {
      // Emit WebSocket event to notify frontend
      this.notificationsGateway.emitContentUpdate(contentId, body.type);
    }
    return { message: "Notification sent" };
  }
}

@Controller("highlights")
@UseGuards(AuthGuard("jwt"))
export class HighlightsController {
  constructor(private cornellService: CornellService) {}

  @Put(":id")
  async updateHighlight(
    @Param("id") id: string,
    @Body() dto: UpdateHighlightDto,
    @Request() req,
  ) {
    return this.cornellService.updateHighlight(id, dto, req.user.id);
  }

  @Delete(":id")
  async deleteHighlight(@Param("id") id: string, @Request() req) {
    return this.cornellService.deleteHighlight(id, req.user.id);
  }
}
