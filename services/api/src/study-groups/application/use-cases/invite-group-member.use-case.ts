import {
  Injectable,
  Inject,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { IStudyGroupsRepository } from "../../domain/study-groups.repository.interface";
import { StudyGroupMember } from "../../domain/study-group.entity";
import { InviteGroupMemberDto } from "../../dto/invite-member.dto";
import { GroupRole } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class InviteGroupMemberUseCase {
  constructor(
    @Inject(IStudyGroupsRepository)
    private readonly repository: IStudyGroupsRepository,
  ) {}

  async execute(
    groupId: string,
    inviterId: string,
    dto: InviteGroupMemberDto,
  ): Promise<void> {
    const inviter = await this.repository.findMember(groupId, inviterId);
    if (!inviter || inviter.status !== "ACTIVE") {
      throw new ForbiddenException("Access denied: not an active member");
    }

    if (!["OWNER", "MOD"].includes(inviter.role)) {
      throw new ForbiddenException("Access denied: requires role OWNER or MOD");
    }

    const existing = await this.repository.findMember(groupId, dto.user_id);

    if (existing) {
      if (existing.status === "ACTIVE") {
        throw new BadRequestException("User is already an active member");
      }
      await this.repository.updateMember(groupId, dto.user_id, {
        status: "INVITED",
        role: dto.role as GroupRole,
      });
      return;
    }

    const member = new StudyGroupMember({
      id: uuidv4(),
      groupId,
      userId: dto.user_id,
      role: dto.role as GroupRole,
      status: "INVITED",
    });

    await this.repository.addMember(member);
  }
}
