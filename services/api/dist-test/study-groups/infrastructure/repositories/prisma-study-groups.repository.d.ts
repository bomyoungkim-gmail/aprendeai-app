import { PrismaService } from "../../../prisma/prisma.service";
import { IStudyGroupsRepository } from "../../domain/study-groups.repository.interface";
import { StudyGroup, StudyGroupMember } from "../../domain/study-group.entity";
export declare class PrismaStudyGroupsRepository implements IStudyGroupsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(group: StudyGroup): Promise<StudyGroup>;
    findById(id: string): Promise<StudyGroup | null>;
    findByUser(userId: string): Promise<StudyGroup[]>;
    update(id: string, updates: Partial<StudyGroup>): Promise<StudyGroup>;
    addMember(member: StudyGroupMember): Promise<StudyGroupMember>;
    findMember(groupId: string, userId: string): Promise<StudyGroupMember | null>;
    updateMember(groupId: string, userId: string, updates: Partial<StudyGroupMember>): Promise<StudyGroupMember>;
    findActiveMembers(groupId: string): Promise<StudyGroupMember[]>;
    addContentShare(groupId: string, contentId: string, createdBy: string): Promise<void>;
    removeContentShare(groupId: string, contentId: string): Promise<void>;
    isContentShared(groupId: string, contentId: string): Promise<boolean>;
    private mapToDomain;
    private mapMemberToDomain;
}
