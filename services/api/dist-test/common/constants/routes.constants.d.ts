export declare const API_CONFIG: {
    readonly PREFIX: "api/v1";
    readonly VERSION: "v1";
};
export declare const ROUTES: {
    readonly AUTH: {
        readonly BASE: "auth";
        readonly REGISTER: "auth/register";
        readonly LOGIN: "auth/login";
        readonly PROFILE: "auth/profile";
        readonly GOOGLE: "auth/google";
        readonly GOOGLE_CALLBACK: "auth/google/callback";
        readonly MICROSOFT: "auth/microsoft";
        readonly MICROSOFT_CALLBACK: "auth/microsoft/callback";
        readonly EXTENSION_DEVICE_START: "auth/extension/device/start";
        readonly EXTENSION_DEVICE_POLL: "auth/extension/device/poll";
        readonly EXTENSION_DEVICE_APPROVE: "auth/extension/device/approve";
        readonly EXTENSION_TOKEN_REFRESH: "auth/extension/token/refresh";
        readonly EXTENSION_GRANTS_REVOKE: (grantId: string) => string;
        readonly EXTENSION_ME: "auth/extension/me";
    };
    readonly FAMILY: {
        readonly BASE: "families";
        readonly MY_FAMILY: "families/my-family";
        readonly BY_ID: (id: string) => string;
        readonly INVITE: (id: string) => string;
        readonly ACCEPT: (id: string) => string;
        readonly USAGE: (id: string) => string;
        readonly REMOVE_MEMBER: (id: string, memberUserId: string) => string;
        readonly TRANSFER_OWNERSHIP: (id: string) => string;
        readonly SET_PRIMARY: (id: string) => string;
        readonly BILLING_HIERARCHY: (id: string) => string;
        readonly POLICY_CREATE: "families/policy";
        readonly POLICY_GET: (familyId: string, learnerId: string) => string;
        readonly POLICY_PROMPT: (policyId: string) => string;
        readonly EDUCATOR_DASHBOARD: (familyId: string, learnerId: string) => string;
        readonly CO_SESSION_START: "families/co-sessions/start";
        readonly CO_SESSION_BY_ID: (id: string) => string;
        readonly CO_SESSION_PROMPT: (id: string) => string;
        readonly CO_SESSION_FINISH: (id: string) => string;
        readonly TEACHBACK_START: "families/teachback/start";
        readonly TEACHBACK_PROMPT: (id: string) => string;
        readonly TEACHBACK_FINISH: (id: string) => string;
        readonly REPORTS_WEEKLY: "families/reports/weekly";
        readonly REPORTS_WEEKLY_PROMPT: "families/reports/weekly/prompt";
    };
    readonly GROUPS: {
        readonly BASE: "study-groups";
        readonly BY_ID: (id: string) => string;
        readonly JOIN: (id: string) => string;
        readonly LEAVE: (id: string) => string;
    };
    readonly CLASSROOM: {
        readonly BASE: "classrooms";
        readonly CREATE: "classrooms";
        readonly BY_ID: (id: string) => string;
        readonly UPDATE: (id: string) => string;
        readonly DELETE: (id: string) => string;
        readonly ENROLL: (id: string) => string;
        readonly ENROLLMENTS: (id: string) => string;
        readonly POLICY_UPSERT: (id: string) => string;
        readonly POLICY_GET: (id: string) => string;
        readonly POLICY_PROMPT: (id: string) => string;
        readonly PLAN_CREATE: (id: string) => string;
        readonly PLAN_CURRENT: (id: string) => string;
        readonly PLAN_PROMPT: (id: string) => string;
        readonly DASHBOARD: (id: string) => string;
        readonly DASHBOARD_PROMPT: (id: string) => string;
        readonly INTERVENTIONS_LOG: (id: string) => string;
        readonly INTERVENTIONS_PROMPT: (id: string) => string;
        readonly REPORTS_WEEKLY: (id: string) => string;
    };
    readonly CONTENT: {
        readonly BASE: "contents";
        readonly BY_ID: (id: string) => string;
        readonly CORNELL: (id: string) => string;
        readonly SESSIONS: (id: string) => string;
    };
    readonly SESSION: {
        readonly BASE: "sessions";
        readonly START: "sessions/start";
        readonly BY_ID: (id: string) => string;
        readonly PROMPT: (id: string) => string;
        readonly FINISH: (id: string) => string;
        readonly PRE: (id: string) => string;
        readonly EVENTS: (id: string) => string;
        readonly ADVANCE: (id: string) => string;
    };
    readonly READING_SESSION: {
        readonly BASE: "reading-sessions";
        readonly BY_ID: (id: string) => string;
        readonly PRE: (id: string) => string;
        readonly EVENTS: (id: string) => string;
        readonly ADVANCE: (id: string) => string;
    };
    readonly OPS: {
        readonly BASE: "ops";
        readonly DAILY_SNAPSHOT: "ops/daily-snapshot";
        readonly WHAT_NEXT: "ops/what-next";
        readonly CONTEXT_CARDS: "ops/context-cards";
        readonly LOG_TIME: "ops/log";
        readonly BOOT_PROMPT: "ops/boot";
        readonly CLOSE_PROMPT: "ops/close";
    };
    readonly INSTITUTIONS: {
        readonly BASE: "institutions";
        readonly BY_ID: (id: string) => string;
        readonly CREATE: "institutions";
        readonly UPDATE: (id: string) => string;
        readonly DELETE: (id: string) => string;
        readonly INVITES: (id: string) => string;
        readonly CREATE_INVITE: (id: string) => string;
        readonly CANCEL_INVITE: (id: string, inviteId: string) => string;
        readonly DOMAINS: (id: string) => string;
        readonly ADD_DOMAIN: (id: string) => string;
        readonly REMOVE_DOMAIN: (id: string, domainId: string) => string;
        readonly PENDING: (id: string) => string;
        readonly PROCESS_APPROVAL: (id: string, approvalId: string) => string;
    };
    readonly FILES: {
        readonly BASE: "files";
        readonly VIEW: (id: string) => string;
        readonly VIEW_URL: (id: string) => string;
    };
    readonly CORNELL: {
        readonly BASE: "contents";
        readonly MY_CONTENTS: "contents/my-contents";
        readonly BY_ID: (id: string) => string;
        readonly CREATE_MANUAL: "contents/create_manual";
        readonly UPDATE: (id: string) => string;
        readonly UPLOAD: "contents/upload";
        readonly BULK_DELETE: "contents/bulk-delete";
        readonly CORNELL_NOTES: (contentId: string) => string;
        readonly HIGHLIGHTS: (contentId: string) => string;
        readonly HIGHLIGHT_BY_ID: (id: string) => string;
        readonly SIMPLIFY: (contentId: string) => string;
        readonly ASSESSMENT: (contentId: string) => string;
        readonly PEDAGOGICAL_CONTEXT: (contentId: string) => string;
        readonly PEDAGOGICAL_DATA: (contentId: string) => string;
        readonly GAME_RESULTS: (contentId: string) => string;
    };
    readonly WEBCLIP: {
        readonly BASE: "webclips";
        readonly CREATE: "webclips";
        readonly START_SESSION: (contentId: string) => string;
    };
};
export declare function apiUrl(route: string): string;
export declare const buildRoute: typeof apiUrl;
