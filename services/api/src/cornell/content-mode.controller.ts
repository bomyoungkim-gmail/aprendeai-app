import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/infrastructure/jwt-auth.guard";
import { ContentModeService } from "./content-mode.service";
import { UpdateContentModeDto } from "./dto/update-content-mode.dto";
import { ContentModeResponseDto } from "./dto/content-mode-response.dto";

/**
 * Content Mode Controller
 *
 * Presentation layer - thin controller following clean architecture:
 * - Validates input (via DTOs and guards)
 * - Handles authentication/authorization
 * - Delegates business logic to service layer
 * - Maps responses to DTOs
 * - Never contains business rules
 */
@ApiTags("Content Mode")
@Controller("cornell/contents")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContentModeController {
  constructor(private readonly contentModeService: ContentModeService) {}

  /**
   * Get content mode information
   * Returns current mode, source, and inferred mode if not set
   */
  @Get(":id/mode")
  @ApiOperation({
    summary: "Get content mode",
    description:
      "Retrieves the current content mode with metadata. Returns inferred mode if not explicitly set.",
  })
  @ApiParam({
    name: "id",
    description: "Content ID",
    example: "cuid123",
  })
  @ApiResponse({
    status: 200,
    description: "Content mode retrieved successfully",
    type: ContentModeResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Content not found",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - JWT token required",
  })
  async getMode(
    @Param("id") contentId: string,
  ): Promise<ContentModeResponseDto> {
    // Delegate to service layer - no business logic here
    return this.contentModeService.getModeInfo(contentId);
  }

  /**
   * Update content mode
   * Only content creator or educators can update mode
   */
  @Put(":id/mode")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Update content mode",
    description:
      "Sets the content mode. Only content creator or educators in the classroom can update.",
  })
  @ApiParam({
    name: "id",
    description: "Content ID",
    example: "cuid123",
  })
  @ApiResponse({
    status: 200,
    description: "Content mode updated successfully",
  })
  @ApiResponse({
    status: 404,
    description: "Content not found",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - User cannot modify this content",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - JWT token required",
  })
  async updateMode(
    @Param("id") contentId: string,
    @Body() dto: UpdateContentModeDto,
    @Request() req: any,
  ): Promise<void> {
    // Extract user ID from JWT token (set by JwtAuthGuard)
    const userId = req.user?.id;

    // Delegate to service layer
    // Service will handle:
    // - Ownership validation
    // - Business rules (source of truth priority)
    // - Database update
    await this.contentModeService.setMode(
      contentId,
      dto.mode,
      userId,
      dto.source || "USER",
    );
  }
}
