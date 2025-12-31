export interface RequestContext {
    user: {
        id: string;
        institutionId: string;
        role: string;
        email: string;
    };
    correlationId: string;
    requestId: string;
}
export declare function setRequestContext(context: RequestContext): void;
export declare function getRequestContext(): RequestContext | undefined;
export declare function getCurrentUser(): {
    id: string;
    institutionId: string;
    role: string;
    email: string;
};
export declare function getCurrentInstitutionId(): string | undefined;
export declare function getCorrelationId(): string | undefined;
