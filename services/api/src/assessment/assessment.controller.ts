import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
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
  findAll(@Request() req: any) {
    return this.assessmentService.findAllByUser(req.user.id);
  }
}
