import { Content } from "./content.entity";
export interface IContentRepository {
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
    addVersion(version: any): Promise<any>;
}
export declare const IContentRepository: unique symbol;
