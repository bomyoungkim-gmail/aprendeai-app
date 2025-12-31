// import type { users } from '@prisma/client';
import { User, UserContextRole, UserSystemRole } from "../domain/user.entity";

// Local interface to avoid fat imports and potential metadata emission crashes during tests
interface PrismaUser {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  system_role: string;
  last_context_role: string;
  last_institution_id?: string | null;

  created_at: Date;
  updated_at: Date;
  [key: string]: any;
}

export class UserMapper {
  // Persistence (Prisma) -> Domain
  static toDomain(raw: PrismaUser): User {
    return new User({
      id: raw.id,
      email: raw.email,
      name: raw.name,
      passwordHash: raw.password_hash,
      systemRole: raw.system_role as UserSystemRole,
      contextRole: raw.last_context_role as UserContextRole,
      institutionId: raw.last_institution_id,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }

  // Domain -> DTO (Simplified for now, as Repo mostly needs toDomain)
  static toDto(user: User | any | null) {
    if (!user) return null;

    // if (user instanceof User) {
    if ((user as any).systemRole) {
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        systemRole: user.systemRole,
        contextRole: user.contextRole,
        institution_id: user.institutionId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      systemRole: user.system_role,
      contextRole: user.last_context_role,
      institutionId: user.last_institution_id,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }
}
