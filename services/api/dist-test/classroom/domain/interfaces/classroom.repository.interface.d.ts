import { Classroom } from '../entities/classroom.entity';
export interface IClassroomRepository {
    create(classroom: Classroom): Promise<Classroom>;
    findById(id: string): Promise<Classroom | null>;
    findByEducator(educatorId: string): Promise<Classroom[]>;
    update(classroom: Classroom): Promise<Classroom>;
    delete(id: string): Promise<void>;
    countEnrollments(classroomId: string): Promise<number>;
}
export declare const IClassroomRepository: unique symbol;
