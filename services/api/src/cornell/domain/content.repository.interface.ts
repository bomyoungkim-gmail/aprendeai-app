import { Content } from "./content.entity";
import { Prisma } from "@prisma/client";

export interface IContentRepository {
  create(data: Partial<Content>): Promise<Content>;
  findById(id: string): Promise<Content | null>;
  update(id: string, data: Partial<Content>): Promise<Content>;
  
  // For search/list optimization, we might pass Prisma args or a custom filter object
  // Standardizing on a custom filter object is cleaner for Domain layer
  findMany(params: {
    where?: any; // To be refined with a clean filter type
    skip?: number;
    take?: number;
    orderBy?: any;
  }): Promise<Content[]>;
  
  count(params: { where?: any }): Promise<number>;
  delete(id: string): Promise<void>;
  addVersion(version: any): Promise<any>; // Using any for entity for now, or use ContentVersion if imported
}

export const IContentRepository = Symbol("IContentRepository");
