import { PrismaService } from "../../prisma/prisma.service";
export declare class ClassGradebookService {
    private prisma;
    constructor(prisma: PrismaService);
    getGradebook(classroomId: string): Promise<{
        students: any[];
        assignments: any[];
        contentIds?: undefined;
        data?: undefined;
    } | {
        contentIds: string[];
        data: {
            studentId: string;
            name: string;
            email: string;
            scores: {};
        }[];
        students?: undefined;
        assignments?: undefined;
    }>;
    exportGradebookCsv(classroomId: string): Promise<string>;
}
