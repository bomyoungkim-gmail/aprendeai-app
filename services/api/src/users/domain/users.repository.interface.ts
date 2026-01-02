import { IRepository } from "../../infrastructure/database/repository.interface";
import { User } from "./user.entity";

export interface IUsersRepository extends IRepository<User> {
  findByEmail(email: string): Promise<User | null>;
  updateSettings(id: string, settings: any): Promise<void>;
  countUsersByDomain(
    domainSuffix: string,
    institutionId: string,
  ): Promise<number>;
}

export const IUsersRepository = Symbol("IUsersRepository");
