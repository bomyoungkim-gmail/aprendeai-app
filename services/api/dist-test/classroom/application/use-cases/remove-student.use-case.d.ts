import { IEnrollmentRepository } from '../../domain/interfaces/enrollment.repository.interface';
export declare class RemoveStudentUseCase {
    private readonly enrollmentRepo;
    constructor(enrollmentRepo: IEnrollmentRepository);
    execute(enrollmentId: string): Promise<void>;
}
