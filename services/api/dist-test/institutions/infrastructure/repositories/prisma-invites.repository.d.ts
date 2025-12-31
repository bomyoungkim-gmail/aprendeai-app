import { PrismaService } from "../../../prisma/prisma.service";
import { IInvitesRepository } from "../../domain/invites.repository.interface";
import { InstitutionInvite } from "../../domain/institution-invite.entity";
export declare class PrismaInvitesRepository implements IInvitesRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(invite: InstitutionInvite): Promise<InstitutionInvite>;
    findByToken(token: string): Promise<InstitutionInvite | null>;
    findById(id: string): Promise<InstitutionInvite | null>;
    findByInstitution(institutionId: string): Promise<InstitutionInvite[]>;
    update(id: string, updates: Partial<InstitutionInvite>): Promise<InstitutionInvite>;
    delete(id: string): Promise<void>;
    countActive(institutionId: string): Promise<number>;
    invalidatePrevious(institutionId: string, email: string): Promise<void>;
    private mapToDomain;
}
