import { IClassroomRepository } from '../../domain/interfaces/classroom.repository.interface';
import { Classroom } from '../../domain/entities/classroom.entity';
export declare class UpdateClassroomUseCase {
    private readonly classroomRepo;
    constructor(classroomRepo: IClassroomRepository);
    execute(id: string, dto: {
        name?: string;
        gradeLevel?: string;
    }): Promise<Classroom>;
}
