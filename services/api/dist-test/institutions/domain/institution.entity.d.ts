export declare class Institution {
    id: string;
    name: string;
    type: any;
    kind: any;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    maxMembers?: number;
    requiresApproval?: boolean;
    slug?: string | null;
    ssoEnabled?: boolean;
    logoUrl?: string | null;
    settings?: any;
    createdAt: Date;
    updatedAt: Date;
    constructor(partial: Partial<Institution>);
}
