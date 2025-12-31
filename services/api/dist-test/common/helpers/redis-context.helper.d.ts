export declare function loadCompactState(tenantId: string, contentId: string): Promise<any | null>;
export declare function enqueueMemoryJob(job: {
    tenantId: string;
    userId: string;
    contentId: string;
    sessionOutcome: any;
}): Promise<boolean>;
export declare function cleanup(): Promise<void>;
