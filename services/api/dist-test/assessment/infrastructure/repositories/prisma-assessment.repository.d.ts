import { PrismaService } from "../../../prisma/prisma.service";
import { IAssessmentRepository } from "../../domain/interfaces/assessment.repository.interface";
import { Assessment } from "../../domain/entities/assessment.entity";
import { AssessmentAttempt } from "../../domain/entities/assessment-attempt.entity";
export declare class PrismaAssessmentRepository implements IAssessmentRepository {
    private prisma;
    constructor(prisma: PrismaService);
    create(assessment: Assessment): Promise<Assessment>;
    findById(id: string): Promise<Assessment | null>;
    findAllByUser(userId: string): Promise<Assessment[]>;
    createAttempt(attempt: AssessmentAttempt, answers: any[]): Promise<AssessmentAttempt>;
    private mapToDomain;
}
