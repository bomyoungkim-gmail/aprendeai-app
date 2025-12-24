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
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { InstitutionsService } from './institutions.service';
import { InstitutionInviteService } from './institution-invite.service';
import { InstitutionDomainService } from './institution-domain.service';
import { ApprovalService } from './approval.service';
import { SSOService } from './sso.service';
import { 
  CreateInstitutionDto, 
  UpdateInstitutionDto,
  CreateInviteDto,
  AddDomainDto,
  ProcessApprovalDto
} from './dto/institution.dto';
import { Roles } from '../admin/decorators/roles.decorator';
import { RolesGuard } from '../admin/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Institutions')
@Controller('institutions')
export class InstitutionsController {
  constructor(
    private readonly institutionsService: InstitutionsService,
    private readonly inviteService: InstitutionInviteService,
    private readonly domainService: InstitutionDomainService,
    private readonly approvalService: ApprovalService,
    private readonly ssoService: SSOService,
  ) {}

  // ==================== Institution CRUD ====================

  @ApiOperation({ summary: 'Create a new institution' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() createInstitutionDto: CreateInstitutionDto) {
    return this.institutionsService.create(createInstitutionDto);
  }

  @ApiOperation({ summary: 'Get all institutions' })
  @Get()
  findAll() {
    return this.institutionsService.findAll();
  }

  @ApiOperation({ summary: 'Get institution by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.institutionsService.findOne(id);
  }

  @ApiOperation({ summary: 'Update an institution' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTITUTION_ADMIN)
  @Patch(':id')
  update(
    @Param('id') id: string, 
    @Body() updateInstitutionDto: UpdateInstitutionDto
  ) {
    return this.institutionsService.update(id, updateInstitutionDto);
  }

  @ApiOperation({ summary: 'Delete an institution' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.institutionsService.remove(id);
  }

  // ==================== Invites ====================

  @ApiOperation({ summary: 'Create an institution invite' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTITUTION_ADMIN)
  @Post(':id/invites')
  createInvite(
    @Param('id') institutionId: string,
    @Body() createInviteDto: CreateInviteDto,
    @Request() req,
  ) {
    return this.inviteService.create(
      institutionId, 
      createInviteDto, 
      req.user.id
    );
  }

  @ApiOperation({ summary: 'Get all invites for an institution' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTITUTION_ADMIN)
  @Get(':id/invites')
  getInvites(@Param('id') institutionId: string) {
    return this.inviteService.findByInstitution(institutionId);
  }

  @ApiOperation({ summary: 'Cancel an invite' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTITUTION_ADMIN)
  @Delete(':id/invites/:inviteId')
  cancelInvite(
    @Param('inviteId') inviteId: string,
    @Request() req,
  ) {
    return this.inviteService.delete(inviteId, req.user.id);
  }

  // ==================== Domains ====================

  @ApiOperation({ summary: 'Add a domain to an institution' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTITUTION_ADMIN)
  @Post(':id/domains')
  addDomain(
    @Param('id') institutionId: string,
    @Body() addDomainDto: AddDomainDto,
    @Request() req,
  ) {
    return this.domainService.addDomain(
      institutionId, 
      addDomainDto, 
      req.user.id
    );
  }

  @ApiOperation({ summary: 'Get all domains for an institution' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTITUTION_ADMIN)
  @Get(':id/domains')
  getDomains(@Param('id') institutionId: string) {
    return this.domainService.findByInstitution(institutionId);
  }

  @ApiOperation({ summary: 'Remove a domain' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTITUTION_ADMIN)
  @Delete(':id/domains/:domainId')
  removeDomain(
    @Param('domainId') domainId: string,
    @Request() req,
  ) {
    return this.domainService.removeDomain(domainId, req.user.id);
  }

  // ==================== Pending Approvals ====================

  @ApiOperation({ summary: 'Get pending approvals for an institution' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTITUTION_ADMIN)
  @Get(':id/pending')
  getPendingApprovals(@Param('id') institutionId: string) {
    return this.approvalService.findByInstitution(institutionId);
  }

  @ApiOperation({ summary: 'Process a pending approval (approve or reject)' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTITUTION_ADMIN)
  @Post(':id/pending/:approvalId')
  @HttpCode(HttpStatus.OK)
  async processApproval(
    @Param('approvalId') approvalId: string,
    @Body() processApprovalDto: ProcessApprovalDto,
    @Request() req,
  ) {
    if (processApprovalDto.approve) {
      return this.approvalService.approve(approvalId, req.user.id);
    } else {
      return this.approvalService.reject(
        approvalId,
        req.user.id,
        processApprovalDto.reason || 'No reason provided'
      );
    }
  }
}
