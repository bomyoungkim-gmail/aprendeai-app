import { SystemRole, ContextRole } from "@prisma/client";
export declare const ROLES_KEY = "roles";
export declare const Roles: (...roles: (SystemRole | ContextRole | string)[]) => import("@nestjs/common").CustomDecorator<string>;
