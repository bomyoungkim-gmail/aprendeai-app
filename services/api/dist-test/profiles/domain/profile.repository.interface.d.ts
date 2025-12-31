import { Profile } from "./profile.entity";
export interface IProfileRepository {
    findByUserId(userId: string): Promise<Profile | null>;
    create(data: Partial<Profile>): Promise<Profile>;
    update(userId: string, data: Partial<Profile>): Promise<Profile>;
}
export declare const IProfileRepository: unique symbol;
