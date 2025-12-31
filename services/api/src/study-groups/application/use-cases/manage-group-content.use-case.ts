import { Injectable, Inject, BadRequestException, ForbiddenException } from "@nestjs/common";
import { IStudyGroupsRepository } from "../../domain/study-groups.repository.interface";

@Injectable()
export class ManageGroupContentUseCase {
  constructor(
    @Inject(IStudyGroupsRepository) private readonly repository: IStudyGroupsRepository,
  ) {}

  async addContent(groupId: string, userId: string, contentId: string): Promise<void> {
    const member = await this.repository.findMember(groupId, userId);
    if (!member || member.status !== "ACTIVE") {
      throw new ForbiddenException("Access denied: not an active member");
    }

    const isShared = await this.repository.isContentShared(groupId, contentId);
    if (isShared) {
      throw new BadRequestException("Content already in playlist");
    }

    await this.repository.addContentShare(groupId, contentId, userId);
  }

  async removeContent(groupId: string, userId: string, contentId: string): Promise<void> {
    const member = await this.repository.findMember(groupId, userId);
    if (!member || member.status !== "ACTIVE" || !["OWNER", "MOD"].includes(member.role)) {
      throw new ForbiddenException("Access denied: requires role OWNER or MOD");
    }

    await this.repository.removeContentShare(groupId, contentId);
  }
}
