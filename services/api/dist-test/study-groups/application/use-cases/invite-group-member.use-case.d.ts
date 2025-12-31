import { IStudyGroupsRepository } from "../../domain/study-groups.repository.interface";
import { InviteGroupMemberDto } from "../../dto/invite-member.dto";
export declare class InviteGroupMemberUseCase {
    private readonly repository;
    constructor(repository: IStudyGroupsRepository);
    execute(groupId: string, inviterId: string, dto: InviteGroupMemberDto): Promise<void>;
}
