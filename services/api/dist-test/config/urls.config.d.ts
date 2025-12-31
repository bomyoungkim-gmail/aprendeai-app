export declare const URL_CONFIG: {
    readonly frontend: {
        readonly base: string;
        readonly verify: string;
    };
    readonly ai: {
        readonly base: string;
        readonly educator: string;
        readonly health: string;
        readonly simplify: string;
        readonly assessment: string;
        readonly pedagogicalEnrich: string;
    };
    readonly api: {
        readonly base: string;
        readonly health: string;
    };
    readonly oauth: {
        readonly google: string;
        readonly microsoft: string;
    };
    readonly storage: {
        readonly base: string;
    };
    readonly corsOrigins: string[];
};
export declare const FRONTEND_URL: string;
export declare const AI_SERVICE_URL: string;
export declare const API_URL: string;
export default URL_CONFIG;
