import { PrismaService } from "../../prisma/prisma.service";
import { IUsersRepository } from "../domain/users.repository.interface";
import { User } from "../domain/user.entity";
export declare class UsersRepository implements IUsersRepository {
    private prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findAll(): Promise<User[]>;
    create(data: any): Promise<User>;
    update(id: string, data: Partial<User>): Promise<User>;
    delete(id: string): Promise<void>;
    updateSettings(id: string, settings: any): Promise<void>;
    countUsersByDomain(domainSuffix: string, institutionId: string): Promise<number>;
}
