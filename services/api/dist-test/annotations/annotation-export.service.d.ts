import { PrismaService } from "../prisma/prisma.service";
export declare class AnnotationExportService {
    private prisma;
    constructor(prisma: PrismaService);
    exportToPDF(userId: string): Promise<Buffer>;
    exportToMarkdown(userId: string): Promise<string>;
    private getAnnotationsForExport;
    private groupByContent;
}
