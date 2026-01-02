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

@Controller("assessment")
@UseGuards(AuthGuard("jwt"))
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @Post()
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
