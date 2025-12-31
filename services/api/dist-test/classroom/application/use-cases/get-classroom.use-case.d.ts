import { IClassroomRepository } from '../../domain/interfaces/classroom.repository.interface';
import { Classroom } from '../../domain/entities/classroom.entity';
export declare class GetClassroomUseCase {
    private readonly classroomRepo;
    constructor(classroomRepo: IClassroomRepository);
    execute(id: string): Promise<Classroom>;
}
