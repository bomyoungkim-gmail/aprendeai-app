import {
  UserContextRole,
  UserSystemRole,
} from "../../users/domain/user.entity";

export interface AuthClaims {
  sub: string;
  email: string;
  systemRole: UserSystemRole;
  contextRole: UserContextRole;
  institutionId?: string | null;
  scopes?: string[];
  clientId?: string;
  type?: "refresh" | "access";
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: any; // User entity or DTO
}

export interface RegisterResult {
  id: string;
  email: string;
  name: string;
}
