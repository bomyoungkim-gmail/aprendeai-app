import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { IUsersRepository } from "../domain/users.repository.interface";
import { User } from "../domain/user.entity";
import { UserMapper } from "./user.mapper";

@Injectable()
export class UsersRepository implements IUsersRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const raw = await this.prisma.users.findUnique({ where: { id } });
    return raw ? UserMapper.toDomain(raw as any) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const raw = await this.prisma.users.findUnique({ where: { email } });
    return raw ? UserMapper.toDomain(raw as any) : null;
  }

  async findAll(): Promise<User[]> {
    const raw = await this.prisma.users.findMany();
    // return raw.map(UserMapper.toDomain);
    return [];
  }

  async create(data: any): Promise<User> {
    const raw = await this.prisma.users.create({
      data: {
        ...data,
        updated_at: new Date(),
      },
    });
    // return UserMapper.toDomain(raw);
    return raw as any;
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const updated = await this.prisma.users.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        // Map domain to prisma fields
        last_context_role: data.contextRole as any,
        last_institution_id: data.institutionId,
        updated_at: new Date(),
      },
    });
    return UserMapper.toDomain(updated as any);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.users.delete({ where: { id } });
  }

  async updateSettings(id: string, settings: any): Promise<void> {
    await this.prisma.users.update({
      where: { id },
      data: { settings },
    });
  }

  async countUsersByDomain(domainSuffix: string, institutionId: string): Promise<number> {
    return this.prisma.users.count({
      where: {
        email: { endsWith: domainSuffix },
        last_institution_id: institutionId,
      } as any, // Cast to any to avoid potential stale client type mismatch
    });
  }
}
