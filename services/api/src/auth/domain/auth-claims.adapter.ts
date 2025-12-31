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

/**
 * Adapter to build JWT claims based on V2 contract.
 * Ensures consistent field names between token payload and what Guards expect.
 */
export function buildClaimsV2(params: BuildClaimsParams): AuthClaims {
  return {
    sub: params.id,
    email: params.email,
    systemRole: params.systemRole as any,
    contextRole: params.contextRole as any,
    institutionId: params.institutionId || null,
    ...(params.scopes && { scopes: params.scopes }),
    ...(params.clientId && { clientId: params.clientId }),
  };
}
