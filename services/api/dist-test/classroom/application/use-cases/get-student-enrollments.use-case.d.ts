import { IEnrollmentRepository } from '../../domain/interfaces/enrollment.repository.interface';
import { Enrollment } from '../../domain/entities/enrollment.entity';
export declare class GetStudentEnrollmentsUseCase {
    private readonly enrollmentRepo;
    constructor(enrollmentRepo: IEnrollmentRepository);
    execute(learnerUserId: string): Promise<Enrollment[]>;
}
