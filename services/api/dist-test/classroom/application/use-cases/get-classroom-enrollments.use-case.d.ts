import { IEnrollmentRepository } from '../../domain/interfaces/enrollment.repository.interface';
import { Enrollment } from '../../domain/entities/enrollment.entity';
export declare class GetClassroomEnrollmentsUseCase {
    private readonly enrollmentRepo;
    constructor(enrollmentRepo: IEnrollmentRepository);
    execute(classroomId: string): Promise<Enrollment[]>;
}
