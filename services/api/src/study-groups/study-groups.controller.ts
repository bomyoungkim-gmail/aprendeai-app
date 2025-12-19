import { Controller, Post, Get, Delete, Param, Body, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StudyGroupsService } from './study-groups.service';
import { GroupSessionsService } from './group-sessions.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { AddContentDto } from './dto/add-content.dto';

@Controller('groups')
@UseGuards(AuthGuard('jwt'))
export class StudyGroupsController {
  constructor(
    private readonly studyGroupsService: StudyGroupsService,
    private readonly groupSessionsService: GroupSessionsService,
  ) {}

  @Post()
  async createGroup(@Request() req, @Body() dto: CreateGroupDto) {
    return this.studyGroupsService.createGroup(req.user.userId, dto);
  }

  @Get()
  async getMyGroups(@Request() req) {
    return this.studyGroupsService.getGroupsByUser(req.user.userId);
  }

  @Get(':groupId')
  async getGroup(@Param('groupId') groupId: string, @Request() req) {
    return this.studyGroupsService.getGroup(groupId, req.user.userId);
  }

  @Post(':groupId/members/invite')
  async inviteMember(
    @Param('groupId') groupId: string,
    @Body() dto: InviteMemberDto,
    @Request() req,
  ) {
    await this.studyGroupsService.inviteMember(groupId, req.user.userId, dto);
    return { message: 'Member invited successfully' };
  }

  @Delete(':groupId/members/:userId')
  async removeMember(
    @Param('groupId') groupId: string,
    @Param('userId') userId: string,
    @Request() req,
  ) {
    await this.studyGroupsService.removeMember(groupId, req.user.userId, userId);
    return { message: 'Member removed successfully' };
  }

  @Post(':groupId/contents')
  async addContent(
    @Param('groupId') groupId: string,
    @Body() dto: AddContentDto,
    @Request() req,
  ) {
    await this.studyGroupsService.addContent(groupId, req.user.userId, dto.contentId);
    return { message: 'Content added to playlist' };
  }

  @Delete(':groupId/contents/:contentId')
  async removeContent(
    @Param('groupId') groupId: string,
    @Param('contentId') contentId: string,
    @Request() req,
  ) {
    await this.studyGroupsService.removeContent(groupId, req.user.userId, contentId);
    return { message: 'Content removed from playlist' };
  }

  @Get(':groupId/sessions')
  async getGroupSessions(
    @Param('groupId') groupId: string,
    @Request() req,
  ) {
    // Verify membership
    await this.studyGroupsService.getGroup(groupId, req.user.userId);
    
    // Return sessions using injected GroupSessionsService
    return this.groupSessionsService.getGroupSessions(groupId);
  }
}
