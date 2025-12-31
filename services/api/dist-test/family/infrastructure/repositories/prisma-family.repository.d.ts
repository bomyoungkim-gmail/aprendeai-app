import { PrismaService } from "../../../prisma/prisma.service";
import { IFamilyRepository } from "../../domain/family.repository.interface";
import { Family, FamilyMember } from "../../domain/family.entity";
export declare class PrismaFamilyRepository implements IFamilyRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(family: Family): Promise<Family>;
    findById(id: string): Promise<Family | null>;
    findByUser(userId: string): Promise<Family[]>;
    update(id: string, updates: Partial<Family>): Promise<Family>;
    delete(id: string): Promise<void>;
    addMember(member: FamilyMember): Promise<FamilyMember>;
    findMember(familyId: string, userId: string): Promise<FamilyMember | null>;
    updateMember(familyId: string, userId: string, updates: Partial<FamilyMember>): Promise<FamilyMember>;
    deleteMember(familyId: string, userId: string): Promise<void>;
    findAll(): Promise<Family[]>;
    private mapToDomain;
    private mapMemberToDomain;
}
