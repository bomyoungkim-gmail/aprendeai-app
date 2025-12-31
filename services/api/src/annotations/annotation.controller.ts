import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  Res,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";
import { Response } from "express";
import { AuthGuard } from "@nestjs/passport";
import { AnnotationService } from "./annotation.service";
import { AnnotationExportService } from "./annotation-export.service";
import { CreateAnnotationDto, UpdateAnnotationDto } from "./dto/annotation.dto";
import { SearchAnnotationsDto } from "./dto/search-annotations.dto";
import { CreateReplyDto } from "./dto/create-reply.dto";
import { SharingService } from "../sharing/sharing.service";
import {
  ShareAnnotationRequest,
  ShareContextType,
} from "../sharing/dto/sharing.dto";

@Controller("contents/:contentId/annotations")
@UseGuards(AuthGuard("jwt"))
export class AnnotationController {
  constructor(private annotationService: AnnotationService) {}

  @Post()
  create(
    @Param("contentId") contentId: string,
    @Body() dto: CreateAnnotationDto,
    @Request() req,
  ) {
    return this.annotationService.create(contentId, req.user.id, dto);
  }

  @Get()
  getAll(
    @Param("contentId") contentId: string,
    @Query("groupId") groupId: string,
    @Request() req,
  ) {
    return this.annotationService.getByContent(contentId, req.user.id, groupId);
  }

  @Put(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateAnnotationDto,
    @Request() req,
  ) {
    return this.annotationService.update(id, req.user.id, dto);
  }

  @Delete(":id")
  delete(@Param("id") id: string, @Request() req) {
    return this.annotationService.delete(id, req.user.id);
  }
}

// Search and filter annotations
@Controller("annotations")
@UseGuards(AuthGuard("jwt"))
export class AnnotationSearchController {
  constructor(
    private annotationService: AnnotationService,
    private exportService: AnnotationExportService,
    private sharingService: SharingService,
  ) {}

  @Get("search")
  search(@Query() params: SearchAnnotationsDto, @Request() req) {
    return this.annotationService.searchAnnotations(req.user.id, params);
  }

  @Post(":id/reply")
  createReply(
    @Param("id") annotationId: string,
    @Body() dto: CreateReplyDto,
    @Request() req,
  ) {
    return this.annotationService.createReply(annotationId, req.user.id, dto);
  }

  @Patch(":id/favorite")
  toggleFavorite(@Param("id") id: string, @Request() req) {
    return this.annotationService.toggleFavorite(id, req.user.id);
  }

  @Get("export")
  async exportAnnotations(
    @Query("format") format: "pdf" | "markdown" = "pdf",
    @Request() req,
    @Res() res: Response,
  ) {
    const userId = req.user.id;

    if (format === "pdf") {
      const pdf = await this.exportService.exportToPDF(userId);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=annotations.pdf",
      );
      return res.send(pdf);
    } else {
      const markdown = await this.exportService.exportToMarkdown(userId);
      res.setHeader("Content-Type", "text/markdown");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=annotations.md",
      );
      return res.send(markdown);
    }
  }

  // Sharing Endpoints (Script 7/8)

  @Post(":id/shares")
  @ApiOperation({ summary: "Share annotation with context" })
  async share(
    @Param("id") annotationId: string,
    @Body() dto: ShareAnnotationRequest,
    @Request() req,
  ) {
    return this.sharingService.shareAnnotation(req.user.id, annotationId, dto);
  }

  @Delete(":id/shares")
  @ApiOperation({ summary: "Revoke annotation share" })
  async revokeShare(
    @Param("id") annotationId: string,
    @Query("contextType") contextType: ShareContextType,
    @Query("contextId") contextId: string,
    @Request() req,
  ) {
    return this.sharingService.revokeAnnotationShare(
      req.user.id,
      annotationId,
      contextType,
      contextId,
    );
  }
}
