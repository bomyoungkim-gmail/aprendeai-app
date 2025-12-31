import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/infrastructure/jwt-auth.guard";
import { ThreadsService } from "./threads.service";
import { GetThreadsQuery, CreateCommentRequest } from "./dto/sharing.dto";

@ApiTags("Threads")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("threads")
export class ThreadsController {
  constructor(private readonly threadsService: ThreadsService) {}

  @Get()
  @ApiOperation({ summary: "Get thread (lazy create) by context and target" })
  async getThread(@Query() query: GetThreadsQuery) {
    return this.threadsService.getThread(query);
  }

  // Explicit Create endpoint is optional per prompt "OU retornar 404 e criar via POST".
  // Since I implemented Lazy Create in GET, I skip explicit POST unless strictly needed.
  // The Prompt: "- POST /threads (create explicit)". I'll add stub reusing logic.
  @Post()
  @ApiOperation({ summary: "Explicitly create thread" })
  async createThread(@Body() dto: GetThreadsQuery) {
    // Logic same as getThread (upsert behavior)
    return this.threadsService.getThread(dto);
  }

  @Post(":id/comments")
  @ApiOperation({ summary: "Add comment to thread" })
  async addComment(
    @Param("id") threadId: string,
    @Body() dto: CreateCommentRequest,
    @Request() req,
  ) {
    return this.threadsService.createComment(threadId, req.user.id, dto);
  }

  @Delete(":threadId/comments/:commentId")
  @ApiOperation({ summary: "Delete (soft) comment" })
  async deleteComment(
    @Param("threadId") threadId: string,
    @Param("commentId") commentId: string,
    @Request() req,
  ) {
    // ThreadID param is for URL clarity but service only needs commentId
    return this.threadsService.deleteComment(commentId, req.user.id);
  }
}
