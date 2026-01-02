import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { IUsersRepository } from "../domain/users.repository.interface";
import { User } from "../domain/user.entity";
import { UserMapper } from "./user.mapper";
import { TransactionHost } from "@nestjs-cls/transactional";
import { TransactionalAdapterPrisma } from "@nestjs-cls/transactional-adapter-prisma";

@Injectable()
export class UsersRepository implements IUsersRepository {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterPrisma>,
    private prisma: PrismaService
  ) {}

  private get db() {
    return (this.txHost.tx as PrismaService) || this.prisma;
  }

  async findById(id: string): Promise<User | null> {
    const raw = await this.db.users.findUnique({ where: { id } });
    return raw ? UserMapper.toDomain(raw as any) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const raw = await this.db.users.findUnique({ where: { email } });
    return raw ? UserMapper.toDomain(raw as any) : null;
  }

  async findAll(): Promise<User[]> {
    const raw = await this.db.users.findMany();
    // return raw.map(UserMapper.toDomain);
    return [];
  }

  async create(data: any): Promise<User> {
    const raw = await this.db.users.create({
      data: {
        ...data,
        updated_at: new Date(),
      },
    });
    // return UserMapper.toDomain(raw);
    return raw as any;
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const updated = await this.db.users.update({
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
    await this.db.users.delete({ where: { id } });
  }

  async updateSettings(id: string, settings: any): Promise<void> {
    await this.db.users.update({
      where: { id },
      data: { settings },
    });
  }

  async countUsersByDomain(domainSuffix: string, institutionId: string): Promise<number> {
    return this.db.users.count({
      where: {
        email: { endsWith: domainSuffix },
        last_institution_id: institutionId,
      } as any, // Cast to any to avoid potential stale client type mismatch
    });
  }
}
