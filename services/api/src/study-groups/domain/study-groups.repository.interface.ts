import { StudyGroup, StudyGroupMember } from "./study-group.entity";

export interface IStudyGroupsRepository {
  create(group: StudyGroup): Promise<StudyGroup>;
  findById(id: string): Promise<StudyGroup | null>;
  findByUser(userId: string): Promise<StudyGroup[]>;
  update(id: string, updates: Partial<StudyGroup>): Promise<StudyGroup>;

  // Members
  addMember(member: StudyGroupMember): Promise<StudyGroupMember>;
  findMember(groupId: string, userId: string): Promise<StudyGroupMember | null>;
  updateMember(
    groupId: string,
    userId: string,
    updates: Partial<StudyGroupMember>,
  ): Promise<StudyGroupMember>;
  findActiveMembers(groupId: string): Promise<StudyGroupMember[]>;

  // Content shares (simplified for now)
  addContentShare(
    groupId: string,
    contentId: string,
    createdBy: string,
  ): Promise<void>;
  removeContentShare(groupId: string, contentId: string): Promise<void>;
  isContentShared(groupId: string, contentId: string): Promise<boolean>;
}

export const IStudyGroupsRepository = Symbol("IStudyGroupsRepository");
