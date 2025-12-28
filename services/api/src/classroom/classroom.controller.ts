import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Request, // Added for auth context
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { ClassroomService } from "./services/classroom.service";
import { EnrollmentService } from "./services/enrollment.service";
import { ClassPolicyService } from "./services/class-policy.service";
import { ClassPlanService } from "./services/class-plan.service";
import { ClassInterventionService } from "./services/class-intervention.service";
import { ClassDashboardService } from "./services/class-dashboard.service";
import {
  CreateClassroomDto,
  UpdateClassroomDto,
  EnrollStudentDto,
  CreateClassPolicyDto,
  CreateWeeklyPlanDto,
  LogInterventionDto,
  GetPolicyPromptDto,
  GetWeeklyPlanPromptDto,
  GetInterventionPromptDto,
  GetDashboardPromptDto,
} from "./dto/classroom.dto";
import { TeacherVerifiedGuard } from "./guards/teacher-verified.guard";

@ApiTags("Classrooms")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("classrooms")
export class ClassroomController {
  constructor(
    private readonly classroomService: ClassroomService,
    private readonly enrollmentService: EnrollmentService,
    private readonly classPolicyService: ClassPolicyService,
    private readonly classPlanService: ClassPlanService,
    private readonly classInterventionService: ClassInterventionService,
    private readonly classDashboardService: ClassDashboardService,
  ) {}

  // CRUD Operations

  @Post()
  @UseGuards(TeacherVerifiedGuard) // Only verified teachers can create classrooms
  @ApiOperation({ summary: "Create a new classroom" })
  async create(@Body() dto: CreateClassroomDto) {
    return this.classroomService.create(dto);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get classroom by ID" })
  async getById(@Param("id") id: string) {
    return this.classroomService.getById(id);
  }

  @Put(":id")
  @UseGuards(TeacherVerifiedGuard) // Only verified teachers can update classrooms
  @ApiOperation({ summary: "Update classroom" })
  async update(@Param("id") id: string, @Body() dto: UpdateClassroomDto) {
    return this.classroomService.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(TeacherVerifiedGuard) // Only verified teachers can delete classrooms
  @ApiOperation({ summary: "Delete classroom" })
  async delete(@Param("id") id: string) {
    return this.classroomService.delete(id);
  }

  // Teacher's Classrooms (for Browser Extension)

  @Get("mine")
  @ApiOperation({ summary: "Get my classrooms (for teacher)" })
  async getMyClassrooms(@CurrentUser() user: any) {
    // Get classrooms where user is the owner/educator
    return this.classroomService.getByEducator(user.id);
  }

  // Enrollment

  @Post(":id/enroll")
  @UseGuards(TeacherVerifiedGuard) // Only verified teachers can enroll students
  @ApiOperation({ summary: "Enroll student in classroom" })
  async enroll(
    @Param("id") classroomId: string,
    @Body() dto: EnrollStudentDto,
  ) {
    return this.enrollmentService.enroll({ ...dto, classroomId });
  }

  @Get(":id/enrollments")
  @ApiOperation({ summary: "Get all enrollments for classroom" })
  async getEnrollments(@Param("id") classroomId: string) {
    return this.enrollmentService.getByClassroom(classroomId);
  }

  // Policy

  @Post(":id/policy")
  @ApiOperation({ summary: "Create or update classroom policy" })
  async upsertPolicy(
    @Param("id") classroomId: string,
    @Body() dto: CreateClassPolicyDto,
  ) {
    return this.classPolicyService.upsert({ ...dto, classroomId });
  }

  @Get(":id/policy")
  @ApiOperation({ summary: "Get classroom policy" })
  async getPolicy(@Param("id") classroomId: string) {
    return this.classPolicyService.getByClassroom(classroomId);
  }

  // Weekly Planning

  @Post(":id/plans/weekly")
  @ApiOperation({ summary: "Create weekly content plan" })
  async createWeeklyPlan(
    @Param("id") classroomId: string,
    @Request() req,
    @Body() dto: CreateWeeklyPlanDto,
  ) {
    return this.classPlanService.createWeeklyPlan(
      classroomId,
      dto.weekStart,
      req.user.id, // Get educator ID from authenticated user
      dto.items,
      dto.toolWords,
    );
  }

  @Get(":id/plans/weekly")
  @ApiOperation({ summary: "Get current week plan" })
  async getCurrentWeekPlan(@Param("id") classroomId: string) {
    return this.classPlanService.getCurrentWeekPlan(classroomId);
  }

  // Dashboard

  @Get(":id/dashboard")
  @ApiOperation({ summary: "Get teacher dashboard with privacy filtering" })
  async getDashboard(@Param("id") classroomId: string) {
    return this.classDashboardService.getTeacherDashboard(classroomId);
  }

  // Interventions

  @Post(":id/interventions")
  @ApiOperation({ summary: "Log student help request" })
  async logHelpRequest(
    @Param("id") classroomId: string,
    @Body() dto: LogInterventionDto,
  ) {
    return this.classInterventionService.logHelpRequest(
      classroomId,
      dto.learnerUserId,
      dto.topic,
    );
  }

  // Prompt-only Endpoints (for LLM-driven interactions)

  @Post(":id/policy/prompt")
  @ApiOperation({ summary: "Get policy configuration prompt" })
  async getPolicyPrompt(
    @Param("id") classroomId: string,
    @Body() dto: GetPolicyPromptDto,
  ) {
    return this.classPolicyService.getPolicyPrompt(dto.units, dto.minutes);
  }

  @Post(":id/plans/weekly/prompt")
  @ApiOperation({ summary: "Get weekly planning prompt" })
  async getWeeklyPlanPrompt(
    @Param("id") classroomId: string,
    @Body() dto: GetWeeklyPlanPromptDto,
  ) {
    return this.classPlanService.getWeeklyPlanPrompt(dto.unitsTarget);
  }

  @Post(":id/interventions/prompt")
  @ApiOperation({ summary: "Get intervention prompt for help request" })
  async getInterventionPrompt(
    @Param("id") classroomId: string,
    @Body() dto: GetInterventionPromptDto,
  ) {
    return this.classInterventionService.getInterventionPrompt(
      dto.studentName,
      dto.topic,
    );
  }

  @Post(":id/dashboard/prompt")
  @ApiOperation({ summary: "Get dashboard summary prompt" })
  async getDashboardPrompt(
    @Param("id") classroomId: string,
    @Body() dto: GetDashboardPromptDto,
  ) {
    return this.classDashboardService.getDashboardPrompt(
      dto.activeCount,
      dto.avgComprehension,
    );
  }
}
