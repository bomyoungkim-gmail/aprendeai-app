import { PrismaService } from "../../../prisma/prisma.service";
import { IInstitutionsRepository } from "../../domain/institutions.repository.interface";
import { Institution } from "../../domain/institution.entity";
import { InstitutionMember } from "../../domain/institution-member.entity";
export declare class PrismaInstitutionsRepository implements IInstitutionsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(institution: Institution): Promise<Institution>;
    findById(id: string): Promise<Institution | null>;
    findAll(): Promise<Institution[]>;
    update(id: string, updates: Partial<Institution>): Promise<Institution>;
    delete(id: string): Promise<void>;
    addMember(member: InstitutionMember): Promise<InstitutionMember>;
    findMember(institutionId: string, userId: string): Promise<InstitutionMember | null>;
    findAdminMember(userId: string): Promise<(InstitutionMember & {
        institutions: Institution;
    }) | null>;
    countMembers(institutionId: string, status?: string): Promise<number>;
    private mapToDomain;
    private mapMemberToDomain;
}
