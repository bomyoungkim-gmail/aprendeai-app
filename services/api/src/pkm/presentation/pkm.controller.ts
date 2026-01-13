import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/infrastructure/jwt-auth.guard";
import { PkmGenerationService } from "../application/pkm-generation.service";
import { IPkmNoteRepository } from "../domain/repositories/pkm-note.repository.interface";
import { GeneratePkmDto } from "../application/dto/generate-pkm.dto";
import { UpdatePkmNoteDto } from "../application/dto/update-pkm-note.dto";
import { PkmNoteDto } from "../application/dto/pkm-note.dto";
import { CreatePkmNoteDto } from "../application/dto/create-pkm-note.dto";
import { DecisionService } from "../../decision/application/decision.service";
import { Inject } from "@nestjs/common";
import { PkmNote } from "../domain/entities/pkm-note.entity";
import { PkmNoteStatus } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

@Controller("pkm")
@UseGuards(JwtAuthGuard)
export class PkmController {
  constructor(
    private readonly pkmGenerationService: PkmGenerationService,
    private readonly decisionService: DecisionService,
    @Inject(IPkmNoteRepository)
    private readonly pkmNoteRepository: IPkmNoteRepository,
  ) {}

  /**
   * POST /pkm/notes
   * Create a new PKM note manually
   */
  @Post("notes")
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreatePkmNoteDto,
    @Request() req: any,
  ): Promise<PkmNoteDto> {
    const userId = req.user.userId;

    const note = new PkmNote(
      uuidv4(),
      userId,
      null, // contentId
      null, // sessionId
      null, // missionId
      dto.topicNodeId || null, // topicNodeId
      dto.title,
      dto.bodyMd,
      dto.tags || [],
      // Cast to expected types - in real app, use validation pipes
      (dto.backlinks as any) || { nearDomain: "", farDomain: "" },
      (dto.sourceMetadata as any) || { sectionIds: [], conceptsUsed: [] },
      PkmNoteStatus.SAVED,
      new Date(),
      new Date(),
    );

    const created = await this.pkmNoteRepository.create(note);
    return this.toDto(created);
  }

  /**
   * POST /pkm/generate
   * Generate PKM note from reading session (SCRIPT 09)
   * Phase check: Only allowed in POST phase
   */
  @Post("generate")
  @HttpCode(HttpStatus.CREATED)
  async generate(
    @Body() dto: GeneratePkmDto,
    @Request() req: any,
  ): Promise<PkmNoteDto> {
    const userId = req.user.userId;

    // Phase check: Ensure session is in POST phase
    const isAllowed = await this.isPKMGenerationAllowed(dto.sessionId);
    if (!isAllowed) {
      throw new ForbiddenException(
        "PKM generation is only allowed in POST phase",
      );
    }

    return this.pkmGenerationService.generateFromSession(userId, dto.sessionId);
  }

  /**
   * PATCH /pkm/notes/:id/save
   * Confirm save: Update status from GENERATED to SAVED
   */
  @Patch("notes/:id/save")
  async save(
    @Param("id") id: string,
    @Request() req: any,
  ): Promise<PkmNoteDto> {
    const userId = req.user.userId;
    return this.pkmGenerationService.confirmSave(id, userId);
  }

  /**
   * GET /pkm/notes
   * List PKM notes for current user with pagination
   * Optional: Filter by topicNodeId for collaborative graph annotations
   */
  @Get("notes")
  async list(
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
    @Query("topicNodeId") topicNodeId?: string,
    @Request() req?: any,
  ): Promise<PkmNoteDto[]> {
    const userId = req.user.userId;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const offsetNum = offset ? parseInt(offset, 10) : 0;

    // If topicNodeId is provided, filter by it
    if (topicNodeId) {
      const notes = await this.pkmNoteRepository.findByTopicNodeId(
        topicNodeId,
        userId,
        limitNum,
        offsetNum,
      );
      return notes.map((note) => this.toDto(note));
    }

    const notes = await this.pkmNoteRepository.findByUserId(
      userId,
      limitNum,
      offsetNum,
    );

    return notes.map((note) => this.toDto(note));
  }

  /**
   * GET /pkm/notes/:id
   * Get single PKM note by ID
   */
  @Get("notes/:id")
  async getById(
    @Param("id") id: string,
    @Request() req: any,
  ): Promise<PkmNoteDto> {
    const userId = req.user.userId;
    const note = await this.pkmNoteRepository.findById(id);

    if (!note) {
      throw new NotFoundException(`PKM note ${id} not found`);
    }

    if (note.userId !== userId) {
      throw new ForbiddenException(
        `PKM note ${id} does not belong to user ${userId}`,
      );
    }

    return this.toDto(note);
  }

  /**
   * PATCH /pkm/notes/:id
   * Update PKM note (body, metadata, tags)
   */
  @Patch("notes/:id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdatePkmNoteDto,
    @Request() req: any,
  ): Promise<PkmNoteDto> {
    const userId = req.user.userId;
    const note = await this.pkmNoteRepository.findById(id);

    if (!note) {
      throw new NotFoundException(`PKM note ${id} not found`);
    }

    if (note.userId !== userId) {
      throw new ForbiddenException(
        `PKM note ${id} does not belong to user ${userId}`,
      );
    }

    const updateData: any = {};
    if (dto.title) updateData.title = dto.title;
    if (dto.bodyMd) updateData.bodyMd = dto.bodyMd;
    if (dto.tags) updateData.tags = dto.tags;
    if (dto.backlinks) {
      updateData.backlinks = {
        ...note.backlinks,
        ...dto.backlinks,
      };
    }

    const updated = await this.pkmNoteRepository.update(id, updateData);
    return this.toDto(updated);
  }

  /**
   * DELETE /pkm/notes/:id
   * Soft delete PKM note (set status to ARCHIVED)
   */
  @Delete("notes/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param("id") id: string, @Request() req: any): Promise<void> {
    const userId = req.user.userId;
    const note = await this.pkmNoteRepository.findById(id);

    if (!note) {
      throw new NotFoundException(`PKM note ${id} not found`);
    }

    if (note.userId !== userId) {
      throw new ForbiddenException(
        `PKM note ${id} does not belong to user ${userId}`,
      );
    }

    await this.pkmNoteRepository.delete(id);
  }

  // ========== Private Helper Methods ==========

  /**
   * Check if PKM generation is allowed (POST phase only)
   * SCRIPT 09: Phase detection requirement
   */
  private async isPKMGenerationAllowed(sessionId: string): Promise<boolean> {
    try {
      const session = await this.decisionService[
        "prisma"
      ].reading_sessions.findUnique({
        where: { id: sessionId },
        select: { phase: true },
      });

      if (!session) {
        return false;
      }

      // Only allow in POST phase
      return session.phase === "POST";
    } catch (error) {
      return false;
    }
  }

  private toDto(note: any): PkmNoteDto {
    return {
      id: note.id,
      userId: note.userId,
      contentId: note.contentId ?? undefined,
      sessionId: note.sessionId ?? undefined,
      missionId: note.missionId ?? undefined,
      topicNodeId: note.topicNodeId ?? undefined,
      title: note.title,
      bodyMd: note.bodyMd,
      tags: note.tags,
      backlinks: note.backlinks,
      sourceMetadata: note.sourceMetadata,
      status: note.status,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    };
  }
}
