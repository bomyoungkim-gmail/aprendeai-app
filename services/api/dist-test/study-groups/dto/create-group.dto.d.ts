import { ScopeType } from "@prisma/client";
export declare class CreateGroupDto {
    name: string;
    scope_type?: ScopeType;
    scope_id?: string;
}
