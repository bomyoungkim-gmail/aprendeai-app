import { IClassroomRepository } from '../../domain/interfaces/classroom.repository.interface';
export declare class DeleteClassroomUseCase {
    private readonly classroomRepo;
    constructor(classroomRepo: IClassroomRepository);
    execute(id: string): Promise<void>;
}
