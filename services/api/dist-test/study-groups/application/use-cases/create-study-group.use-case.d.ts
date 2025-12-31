import { IStudyGroupsRepository } from "../../domain/study-groups.repository.interface";
import { StudyGroup } from "../../domain/study-group.entity";
import { CreateGroupDto } from "../../dto/create-group.dto";
import { PrismaService } from "../../../prisma/prisma.service";
export declare class CreateStudyGroupUseCase {
    private readonly repository;
    private readonly prisma;
    constructor(repository: IStudyGroupsRepository, prisma: PrismaService);
    execute(userId: string, dto: CreateGroupDto): Promise<StudyGroup>;
}
