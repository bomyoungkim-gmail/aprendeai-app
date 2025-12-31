import { institutions } from "@prisma/client";

export class InstitutionMapper {
  static toDto(institution: any | null) {
    if (!institution) return null;

    return {
      id: institution.id,
      name: institution.name,
      type: institution.type,
      kind: institution.kind,
      city: institution.city,
      state: institution.state,
      country: institution.country,
      maxMembers: institution.max_members,
      requiresApproval: institution.requires_approval,
      slug: institution.slug,
      ssoEnabled: institution.sso_enabled,
      createdAt: institution.created_at,
      updatedAt: institution.updated_at,
      // Include stats if present (from getInstitutionForAdmin)
      memberCount: (institution as any).memberCount,
      activeInvites: (institution as any).activeInvites,
      pendingApprovals: (institution as any).pendingApprovals,
      domains: (institution as any).domains,
    };
  }

  static toCollectionDto(institutions: any[]) {
    return institutions.map((inst) => this.toDto(inst));
  }
}
