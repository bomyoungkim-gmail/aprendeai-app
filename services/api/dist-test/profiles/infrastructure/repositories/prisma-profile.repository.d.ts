import { PrismaService } from "../../../prisma/prisma.service";
import { IProfileRepository } from "../../domain/profile.repository.interface";
import { Profile } from "../../domain/profile.entity";
export declare class PrismaProfileRepository implements IProfileRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findByUserId(userId: string): Promise<Profile | null>;
    create(data: Partial<Profile>): Promise<Profile>;
    update(userId: string, data: Partial<Profile>): Promise<Profile>;
    private mapToDomain;
}
