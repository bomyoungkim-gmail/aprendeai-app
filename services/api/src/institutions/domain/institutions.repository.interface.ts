import { Institution } from "./institution.entity";
import { InstitutionMember } from "./institution-member.entity";

export interface IInstitutionsRepository {
  create(institution: Institution): Promise<Institution>;
  findById(id: string): Promise<Institution | null>;
  findAll(): Promise<Institution[]>;
  update(id: string, updates: Partial<Institution>): Promise<Institution>;
  delete(id: string): Promise<void>;

  // Members
  addMember(member: InstitutionMember): Promise<InstitutionMember>;
  findMember(institutionId: string, userId: string): Promise<InstitutionMember | null>;
  findAdminMember(userId: string): Promise<(InstitutionMember & { institutions: Institution }) | null>;
  countMembers(institutionId: string, status?: string): Promise<number>;
}

export const IInstitutionsRepository = Symbol("IInstitutionsRepository");
