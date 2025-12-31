import { PrismaService } from "../../../prisma/prisma.service";
import { ICornellRepository } from "../../domain/interfaces/cornell.repository.interface";
import { CornellNote } from "../../domain/entities/cornell-note.entity";
export declare class PrismaCornellRepository implements ICornellRepository {
    private prisma;
    constructor(prisma: PrismaService);
    findByContentAndUser(contentId: string, userId: string): Promise<CornellNote | null>;
    create(note: CornellNote): Promise<CornellNote>;
    update(note: CornellNote): Promise<CornellNote>;
    private mapToDomain;
}
