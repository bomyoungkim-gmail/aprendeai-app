import { IClassroomRepository } from '../../domain/interfaces/classroom.repository.interface';
import { Classroom } from '../../domain/entities/classroom.entity';
export declare class CreateClassroomUseCase {
    private readonly classroomRepo;
    constructor(classroomRepo: IClassroomRepository);
    execute(dto: {
        name: string;
        ownerEducatorId: string;
        institutionId: string;
        gradeLevel?: string;
    }): Promise<Classroom>;
}
