import { AuthClaims } from "./auth.types";
export interface BuildClaimsParams {
    id: string;
    email: string;
    systemRole: string;
    contextRole: string;
    institutionId?: string | null;
    scopes?: string[];
    clientId?: string;
}
export declare function buildClaimsV2(params: BuildClaimsParams): AuthClaims;
