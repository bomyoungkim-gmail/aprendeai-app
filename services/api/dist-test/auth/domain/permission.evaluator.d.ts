import { PrismaService } from "../../prisma/prisma.service";
export declare class PermissionEvaluator {
    private prisma;
    constructor(prisma: PrismaService);
    canCreateClassroom(userId: string): Promise<boolean>;
    canExportGradebook(userId: string, classroomId: string): Promise<boolean>;
    canUnenrollStudent(actorId: string, classroomId: string): Promise<boolean>;
}
