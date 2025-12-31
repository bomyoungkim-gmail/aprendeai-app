import { PrismaService } from "../../../prisma/prisma.service";
import { IContentRepository } from "../../domain/content.repository.interface";
import { Content, ContentVersion } from "../../domain/content.entity";
export declare class PrismaContentRepository implements IContentRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: Partial<Content>): Promise<Content>;
    findById(id: string): Promise<Content | null>;
    update(id: string, data: Partial<Content>): Promise<Content>;
    findMany(params: {
        where?: any;
        skip?: number;
        take?: number;
        orderBy?: any;
    }): Promise<Content[]>;
    count(params: {
        where?: any;
    }): Promise<number>;
    delete(id: string): Promise<void>;
    addVersion(version: ContentVersion): Promise<ContentVersion>;
    private mapToDomain;
}
