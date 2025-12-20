import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { FamilyService } from './family.service';
import { CreateFamilyDto } from './dto/create-family.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Adjust import if needed
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('Family')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('families')
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new family' })
  create(@CurrentUser() user: User, @Body() createFamilyDto: CreateFamilyDto) {
    return this.familyService.create(user.id, createFamilyDto);
  }

  @Get()
  @ApiOperation({ summary: 'List my families' })
  findAll(@CurrentUser() user: User) {
    return this.familyService.findAllForUser(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get family details' })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.familyService.findOne(id, user.id);
  }

  @Post(':id/invite')
  @ApiOperation({ summary: 'Invite a member to the family' })
  invite(@Param('id') id: string, @CurrentUser() user: User, @Body() inviteDto: InviteMemberDto) {
    return this.familyService.inviteMember(id, user.id, inviteDto);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Accept invitation to join family' })
  acceptInvite(@Param('id') id: string, @CurrentUser() user: User) {
    return this.familyService.acceptInvite(id, user.id);
  }

  @Get(':id/usage')
  @ApiOperation({ summary: 'Get family usage analytics' })
  getUsage(@Param('id') id: string, @CurrentUser() user: User) {
    return this.familyService.getAnalytics(id, user.id);
  }

  @Delete(':id/members/:memberUserId')
  @ApiOperation({ summary: 'Remove a member from the family' })
  removeMember(
    @Param('id') id: string,
    @Param('memberUserId') memberUserId: string,
    @CurrentUser() user: User,
  ) {
    return this.familyService.removeMember(id, user.id, memberUserId);
  }

  @Post(':id/transfer-ownership')
  @ApiOperation({ summary: 'Transfer family ownership' })
  transferOwnership(
    @Param('id') id: string, 
    @CurrentUser() user: User,
    @Body('newOwnerId') newOwnerId: string
  ) {
    return this.familyService.transferOwnership(id, user.id, newOwnerId);
  }

  @Post(':id/primary')
  @ApiOperation({ summary: 'Set family as primary context' })
  setPrimary(@Param('id') id: string, @CurrentUser() user: User) {
    return this.familyService.setPrimaryFamily(user.id, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a family' })
  deleteFamily(@Param('id') id: string, @CurrentUser() user: User) {
    return this.familyService.deleteFamily(id, user.id);
  }
}
