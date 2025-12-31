export declare class MetricsQueryDto {
    metric: string;
    from: string;
    to: string;
    bucket: string;
}
export declare class ErrorQueryDto {
    from?: string;
    to?: string;
    resolved?: boolean;
    endpoint?: string;
    limit?: number;
}
export declare class UsageQueryDto {
    provider?: string;
    from: string;
    to: string;
}
export declare class OverviewQueryDto {
    hours?: number;
}
