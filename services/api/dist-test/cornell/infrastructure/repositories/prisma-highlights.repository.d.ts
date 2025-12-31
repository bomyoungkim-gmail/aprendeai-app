import { PrismaService } from "../../../prisma/prisma.service";
import { IHighlightsRepository } from "../../domain/interfaces/highlights.repository.interface";
import { Highlight } from "../../domain/entities/highlight.entity";
export declare class PrismaHighlightsRepository implements IHighlightsRepository {
    private prisma;
    constructor(prisma: PrismaService);
    findAllByContent(contentId: string, userId: string): Promise<Highlight[]>;
    findById(id: string): Promise<Highlight | null>;
    create(highlight: Highlight): Promise<Highlight>;
    update(highlight: Highlight): Promise<Highlight>;
    delete(id: string): Promise<void>;
    private mapToDomain;
}
