import { Injectable, Inject } from "@nestjs/common";
import { IStudyGroupsRepository } from "../../domain/study-groups.repository.interface";
import { StudyGroup, StudyGroupMember } from "../../domain/study-group.entity";
import { CreateGroupDto } from "../../dto/create-group.dto";
import { PrismaService } from "../../../prisma/prisma.service";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class CreateStudyGroupUseCase {
  constructor(
    @Inject(IStudyGroupsRepository) private readonly repository: IStudyGroupsRepository,
    private readonly prisma: PrismaService, // For transaction
  ) {}

  async execute(userId: string, dto: CreateGroupDto): Promise<StudyGroup> {
    return this.prisma.$transaction(async (tx) => {
      const groupId = uuidv4();
      const group = new StudyGroup({
        id: groupId,
        name: dto.name,
        scopeType: dto.scope_type,
        scopeId: dto.scope_id,
        ownerId: userId,
      });

      // We rely on repository or direct tx.
      // Since repository doesn't take 'tx' yet, I'll use tx directly for atomicity if needed,
      // or I'll just use the repository calls if they were part of a tx manager.
      // For now, I'll use tx directly as the previous service did.
      
      const created = await tx.study_groups.create({
        data: {
          id: group.id,
          name: group.name,
          scope_type: group.scopeType as any,
          scope_id: group.scopeId,
          users_owner: { connect: { id: userId } },
        },
      });

      await tx.study_group_members.create({
        data: {
          group_id: created.id,
          user_id: userId,
          role: "OWNER",
          status: "ACTIVE",
        },
      });

      return new StudyGroup({
          id: created.id,
          name: created.name,
          scopeId: created.scope_id,
          scopeType: created.scope_type,
          ownerId: userId,
      });
    });
  }
}
