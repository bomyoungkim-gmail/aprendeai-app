"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstitutionMapper = void 0;
class InstitutionMapper {
    static toDto(institution) {
        if (!institution)
            return null;
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
            memberCount: institution.memberCount,
            activeInvites: institution.activeInvites,
            pendingApprovals: institution.pendingApprovals,
            domains: institution.domains,
        };
    }
    static toCollectionDto(institutions) {
        return institutions.map((inst) => this.toDto(inst));
    }
}
exports.InstitutionMapper = InstitutionMapper;
//# sourceMappingURL=institution.mapper.js.map