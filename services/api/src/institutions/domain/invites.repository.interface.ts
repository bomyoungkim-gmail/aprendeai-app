import { InstitutionInvite } from "./institution-invite.entity";

export interface IInvitesRepository {
  create(invite: InstitutionInvite): Promise<InstitutionInvite>;
  findByToken(token: string): Promise<InstitutionInvite | null>;
  findById(id: string): Promise<InstitutionInvite | null>;
  findByInstitution(institutionId: string): Promise<InstitutionInvite[]>;
  update(id: string, updates: Partial<InstitutionInvite>): Promise<InstitutionInvite>;
  delete(id: string): Promise<void>;
  countActive(institutionId: string): Promise<number>;
  invalidatePrevious(institutionId: string, email: string): Promise<void>;
}

export const IInvitesRepository = Symbol("IInvitesRepository");
