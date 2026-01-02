import { Family, FamilyMember } from "./family.entity";

export interface IFamilyRepository {
  create(family: Family): Promise<Family>;
  findById(id: string): Promise<Family | null>;
  findByUser(userId: string): Promise<Family[]>;
  update(id: string, updates: Partial<Family>): Promise<Family>;
  delete(id: string): Promise<void>;
  findAll(): Promise<Family[]>;

  // Members
  addMember(member: FamilyMember): Promise<FamilyMember>;
  findMember(familyId: string, userId: string): Promise<FamilyMember | null>;
  updateMember(
    familyId: string,
    userId: string,
    updates: Partial<FamilyMember>,
  ): Promise<FamilyMember>;
  deleteMember(familyId: string, userId: string): Promise<void>;
}

export const IFamilyRepository = Symbol("IFamilyRepository");
