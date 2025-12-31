export enum UserSystemRole {
  ADMIN = "ADMIN",
  SUPPORT = "SUPPORT",
  USER = "USER",
}

export enum UserContextRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  TEACHER = "TEACHER",
  STUDENT = "STUDENT",
  PARENT = "PARENT",
  MEMBER = "MEMBER",
}

export interface UserProps {
  id: string;
  email: string;
  name?: string;
  passwordHash?: string | null;
  systemRole: UserSystemRole;
  contextRole: UserContextRole;
  institutionId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  public readonly id: string;
  public readonly email: string;
  public name?: string;
  private _passwordHash?: string | null;
  public systemRole: UserSystemRole;
  public contextRole: UserContextRole;
  public institutionId?: string | null;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(props: UserProps) {
    this.id = props.id;
    this.email = props.email;
    this.name = props.name;
    this._passwordHash = props.passwordHash;
    this.systemRole = props.systemRole;
    this.contextRole = props.contextRole;
    this.institutionId = props.institutionId;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  get passwordHash(): string | null | undefined {
    return this._passwordHash;
  }

  updateProfile(name: string): void {
    this.name = name;
    this.updatedAt = new Date();
  }

  updateContext(role: UserContextRole, institutionId?: string | null): void {
    this.contextRole = role;
    this.institutionId = institutionId ?? null;
    this.updatedAt = new Date();
  }
}
