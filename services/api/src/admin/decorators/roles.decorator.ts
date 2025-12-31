import { SetMetadata } from "@nestjs/common";
import { SystemRole, ContextRole } from "@prisma/client";

export const ROLES_KEY = "roles";
export const Roles = (...roles: (SystemRole | ContextRole | string)[]) =>
  SetMetadata(ROLES_KEY, roles);
