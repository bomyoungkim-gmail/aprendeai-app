import { IClassroomRepository } from '../../domain/interfaces/classroom.repository.interface';
export declare class GetEducatorClassroomsUseCase {
    private readonly classroomRepo;
    constructor(classroomRepo: IClassroomRepository);
    execute(educatorId: string): Promise<{
        classroomId: string;
        name: string;
        gradeLevel: string;
        enrollmentCount: number;
    }[]>;
}
