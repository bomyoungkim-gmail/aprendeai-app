export declare class SessionsQueryDto {
    page?: number;
    limit?: number;
    since?: string;
    until?: string;
    phase?: "PRE" | "DURING" | "POST";
    query?: string;
    sortBy?: "startedAt" | "duration";
    sortOrder?: "asc" | "desc";
}
