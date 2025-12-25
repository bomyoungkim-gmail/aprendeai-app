import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiConsumes,
} from "@nestjs/swagger";
import { InstitutionsService } from "./institutions.service";
import { InstitutionInviteService } from "./institution-invite.service";
import { InstitutionDomainService } from "./institution-domain.service";
import { ApprovalService } from "./approval.service";
import { SSOService } from "./sso.service";
import { BulkService } from "../bulk/bulk.service";
import {
  CreateInstitutionDto,
  UpdateInstitutionDto,
  CreateInviteDto,
  AddDomainDto,
  ProcessApprovalDto,
} from "./dto/institution.dto";
import { Roles } from "../admin/decorators/roles.decorator";
import { RolesGuard } from "../admin/guards/roles.guard";
import { UserRole } from "@prisma/client";

@ApiTags("Institutions")
@Controller("institutions")
@UseGuards(RolesGuard)
@ApiBearerAuth()
export class InstitutionsController {
  constructor(
    private readonly institutionsService: InstitutionsService,
    private readonly inviteService: InstitutionInviteService,
    private readonly domainService: InstitutionDomainService,
    private readonly approvalService: ApprovalService,
    private readonly ssoService: SSOService,
    private readonly bulkService: BulkService,
  ) {}

  // ==================== Institution CRUD ====================

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Create a new institution" })
  @ApiResponse({
    status: 201,
    description: "The institution has been successfully created.",
  })
  create(@Body() createInstitutionDto: CreateInstitutionDto) {
    return this.institutionsService.create(createInstitutionDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Get all institutions" })
  @ApiResponse({ status: 200, description: "Return all institutions." })
  findAll() {
    return this.institutionsService.findAll();
  }

  @Get("my-institution")
  @ApiOperation({ summary: "Get my institution (for INSTITUTION_ADMIN)" })
  @ApiResponse({
    status: 200,
    description: "Returns institution data with stats",
  })
  getMyInstitution(@Request() req) {
    return this.institutionsService.getInstitutionForAdmin(req.user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get institution by ID" })
  @ApiResponse({ status: 200, description: "Return the institution." })
  findOne(@Param("id") id: string) {
    return this.institutionsService.findOne(id);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: "Update an institution" })
  @ApiResponse({
    status: 200,
    description: "The institution has been successfully updated.",
  })
  update(
    @Param("id") id: string,
    @Body() updateInstitutionDto: UpdateInstitutionDto,
  ) {
    return this.institutionsService.update(id, updateInstitutionDto);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Delete an institution" })
  @ApiResponse({
    status: 200,
    description: "The institution has been successfully deleted.",
  })
  remove(@Param("id") id: string) {
    return this.institutionsService.remove(id);
  }

  // ==================== Invites ====================

  @Post(":id/invites")
  @Roles(UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: "Create an institution invite" })
  createInvite(
    @Param("id") institutionId: string,
    @Body() createInviteDto: CreateInviteDto,
    @Request() req,
  ) {
    return this.inviteService.create(
      institutionId,
      createInviteDto,
      req.user.id,
    );
  }

  @Get(":id/invites")
  @Roles(UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: "Get all invites for an institution" })
  getInvites(@Param("id") institutionId: string) {
    return this.inviteService.findByInstitution(institutionId);
  }

  @Delete(":id/invites/:inviteId")
  @Roles(UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: "Cancel an invite" })
  cancelInvite(@Param("inviteId") inviteId: string, @Request() req) {
    return this.inviteService.delete(inviteId, req.user.id);
  }

  // ==================== Bulk Actions ====================

  @Post(":id/bulk-invite")
  @Roles(UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: "Bulk invite members via CSV" })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file"))
  async bulkInvite(
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.bulkService.bulkInviteFromCSV(id, file.buffer);
  }

  @Get(":id/export")
  @Roles(UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: "Export members as CSV" })
  async exportMembers(@Param("id") id: string) {
    const csv = await this.bulkService.exportMembersCSV(id);
    return { csv };
  }

  // ==================== Domains ====================

  @Post(":id/domains")
  @Roles(UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: "Add a domain to an institution" })
  addDomain(
    @Param("id") institutionId: string,
    @Body() addDomainDto: AddDomainDto,
    @Request() req,
  ) {
    return this.domainService.addDomain(
      institutionId,
      addDomainDto,
      req.user.id,
    );
  }

  @Get(":id/domains")
  @Roles(UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: "Get all domains for an institution" })
  getDomains(@Param("id") institutionId: string) {
    return this.domainService.findByInstitution(institutionId);
  }

  @Delete(":id/domains/:domainId")
  @Roles(UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: "Remove a domain" })
  removeDomain(@Param("domainId") domainId: string, @Request() req) {
    return this.domainService.removeDomain(domainId, req.user.id);
  }

  // ==================== Pending Approvals ====================

  @Get(":id/pending")
  @Roles(UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: "Get pending approvals for an institution" })
  getPendingApprovals(@Param("id") institutionId: string) {
    return this.approvalService.findByInstitution(institutionId);
  }

  @Post(":id/pending/:approvalId")
  @Roles(UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: "Process a pending approval (approve or reject)" })
  @HttpCode(HttpStatus.OK)
  async processApproval(
    @Param("approvalId") approvalId: string,
    @Body() processApprovalDto: ProcessApprovalDto,
    @Request() req,
  ) {
    if (processApprovalDto.approve) {
      return this.approvalService.approve(approvalId, req.user.id);
    } else {
      return this.approvalService.reject(
        approvalId,
        req.user.id,
        processApprovalDto.reason || "Rejected by admin",
      );
    }
  }

  // ==================== SSO Configuration ====================

  @Post(":id/sso")
  @Roles(UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: "Configure SSO for institution" })
  async createSSOConfig(
    @Param("id") institutionId: string,
    @Body() dto: any,
    @Request() req,
  ) {
    return this.ssoService.createConfig(
      { ...dto, institutionId },
      req.user.id,
    );
  }

  @Get(":id/sso")
  @Roles(UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: "Get SSO configuration" })
  async getSSOConfig(@Param("id") institutionId: string) {
    return this.ssoService.getConfig(institutionId);
  }

  @Patch(":id/sso")
  @Roles(UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: "Update SSO configuration" })
  async updateSSOConfig(
    @Param("id") institutionId: string,
    @Body() dto: any,
    @Request() req,
  ) {
    return this.ssoService.updateConfig(institutionId, dto, req.user.id);
  }

  @Delete(":id/sso")
  @Roles(UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: "Delete SSO configuration" })
  async deleteSSOConfig(@Param("id") institutionId: string, @Request() req) {
    return this.ssoService.deleteConfig(institutionId, req.user.id);
  }

  @Post(":id/sso/test")
  @Roles(UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: "Test SSO configuration" })
  async testSSOConfig(@Param("id") institutionId: string) {
    // TODO: Implement test logic
    return { success: true, message: "SSO configuration is valid" };
  }
}
