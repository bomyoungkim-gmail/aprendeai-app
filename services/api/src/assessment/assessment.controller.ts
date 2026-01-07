import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Query,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AssessmentService } from "./assessment.service";
import { CreateAssessmentDto } from "./dto/assessment.dto";
import { ApiKeyGuard } from "../auth/infrastructure/api-key.guard";
import { Public } from "../auth/presentation/decorators/public.decorator";

@Controller("assessment")
@UseGuards(AuthGuard("jwt"))
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @Post()
  @UseGuards(ApiKeyGuard) // Allow workers to create assessments
  @Public()
  // TODO: Add specific rate limiting for worker endpoints if volume increases
  create(@Body() createAssessmentDto: CreateAssessmentDto) {
    return this.assessmentService.create(createAssessmentDto);
  }

  @Get()
  findAll(@Request() req: any, @Query("contentId") contentId?: string) {
    if (contentId) {
      return this.assessmentService.findByContent(contentId);
    }
    return this.assessmentService.findAllByUser(req.user.id);
  }
}
