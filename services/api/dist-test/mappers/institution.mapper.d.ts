export declare class InstitutionMapper {
    static toDto(institution: any | null): {
        id: any;
        name: any;
        type: any;
        kind: any;
        city: any;
        state: any;
        country: any;
        maxMembers: any;
        requiresApproval: any;
        slug: any;
        ssoEnabled: any;
        createdAt: any;
        updatedAt: any;
        memberCount: any;
        activeInvites: any;
        pendingApprovals: any;
        domains: any;
    };
    static toCollectionDto(institutions: any[]): {
        id: any;
        name: any;
        type: any;
        kind: any;
        city: any;
        state: any;
        country: any;
        maxMembers: any;
        requiresApproval: any;
        slug: any;
        ssoEnabled: any;
        createdAt: any;
        updatedAt: any;
        memberCount: any;
        activeInvites: any;
        pendingApprovals: any;
        domains: any;
    }[];
}
