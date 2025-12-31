import { IStudyGroupsRepository } from "./domain/study-groups.repository.interface";
import { CreateStudyGroupUseCase } from "./application/use-cases/create-study-group.use-case";
import { InviteGroupMemberUseCase } from "./application/use-cases/invite-group-member.use-case";
import { ManageGroupContentUseCase } from "./application/use-cases/manage-group-content.use-case";
import { CreateGroupDto } from "./dto/create-group.dto";
import { InviteGroupMemberDto } from "./dto/invite-member.dto";
export declare class StudyGroupsService {
    private readonly repository;
    private readonly createGroupUseCase;
    private readonly inviteMemberUseCase;
    private readonly manageContentUseCase;
    constructor(repository: IStudyGroupsRepository, createGroupUseCase: CreateStudyGroupUseCase, inviteMemberUseCase: InviteGroupMemberUseCase, manageContentUseCase: ManageGroupContentUseCase);
    createGroup(userId: string, dto: CreateGroupDto): Promise<import("./domain/study-group.entity").StudyGroup>;
    getGroupsByUser(userId: string): Promise<import("./domain/study-group.entity").StudyGroup[]>;
    getGroup(groupId: string, userId: string): Promise<import("./domain/study-group.entity").StudyGroup>;
    inviteMember(groupId: string, inviterId: string, dto: InviteGroupMemberDto): Promise<void>;
    addContent(groupId: string, userId: string, contentId: string): Promise<void>;
    removeContent(groupId: string, userId: string, contentId: string): Promise<void>;
    assertMembership(groupId: string, userId: string): Promise<import("./domain/study-group.entity").StudyGroupMember>;
    getActiveMembers(groupId: string): Promise<import("./domain/study-group.entity").StudyGroupMember[]>;
    removeMember(groupId: string, removerId: string, targetUserId: string): Promise<void>;
}
