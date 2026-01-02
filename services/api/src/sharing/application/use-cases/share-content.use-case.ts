import { Injectable, Inject, ForbiddenException } from "@nestjs/common";
import { ISharingRepository } from "../../domain/interfaces/sharing.repository.interface";
import {
  ContentShare,
  ShareContextType,
  SharePermission,
} from "../../domain/entities/content-share.entity";
import { PermissionEvaluator } from "../../../auth/domain/permission.evaluator";

@Injectable()
export class ShareContentUseCase {
  constructor(
    @Inject(ISharingRepository)
    private readonly sharingRepo: ISharingRepository,
    private readonly permissions: PermissionEvaluator,
  ) {}

  async execute(
    userId: string,
    contentId: string,
    dto: {
      contextType: ShareContextType;
      contextId: string;
      permission: SharePermission;
    },
  ): Promise<ContentShare> {
    // Permission Check (from original service)
    if (
      dto.contextType === ShareContextType.CLASSROOM &&
      dto.permission === SharePermission.ASSIGN
    ) {
      const canAssign = await this.permissions.canCreateClassroom(userId);
      if (!canAssign) {
        throw new ForbiddenException(
          "Only verified teachers can assign content in classrooms",
        );
      }
    }

    const share = new ContentShare(
      contentId,
      dto.contextType,
      dto.contextId,
      dto.permission,
      userId,
      new Date(),
    );

    return this.sharingRepo.upsertContentShare(share);
  }
}
