import { EnrollStudentDto } from "../dto/classroom.dto";
import { EnrollStudentUseCase } from "../application/use-cases/enroll-student.use-case";
import { RemoveStudentUseCase } from "../application/use-cases/remove-student.use-case";
import { GetClassroomEnrollmentsUseCase } from "../application/use-cases/get-classroom-enrollments.use-case";
import { GetStudentEnrollmentsUseCase } from "../application/use-cases/get-student-enrollments.use-case";
export declare class EnrollmentService {
    private readonly enrollUseCase;
    private readonly removeUseCase;
    private readonly getClassroomEnrollmentsUseCase;
    private readonly getStudentEnrollmentsUseCase;
    constructor(enrollUseCase: EnrollStudentUseCase, removeUseCase: RemoveStudentUseCase, getClassroomEnrollmentsUseCase: GetClassroomEnrollmentsUseCase, getStudentEnrollmentsUseCase: GetStudentEnrollmentsUseCase);
    enroll(dto: EnrollStudentDto): Promise<import("../domain/entities/enrollment.entity").Enrollment>;
    remove(enrollmentId: string): Promise<void>;
    getByClassroom(classroomId: string): Promise<import("../domain/entities/enrollment.entity").Enrollment[]>;
    getByStudent(learnerUserId: string): Promise<import("../domain/entities/enrollment.entity").Enrollment[]>;
}
