import { IStudyGroupsRepository } from "../../domain/study-groups.repository.interface";
export declare class ManageGroupContentUseCase {
    private readonly repository;
    constructor(repository: IStudyGroupsRepository);
    addContent(groupId: string, userId: string, contentId: string): Promise<void>;
    removeContent(groupId: string, userId: string, contentId: string): Promise<void>;
}
