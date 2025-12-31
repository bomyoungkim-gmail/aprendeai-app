export interface ValidationResult {
    valid: boolean;
    errors?: any[];
}
export declare class EventSchemaService {
    private readonly logger;
    private readonly ajv;
    private readonly schemas;
    constructor();
    private loadSchemas;
    validate(eventType: string, version: number, payload: any): ValidationResult;
    getLatestVersion(eventType: string): number;
    getAvailableEventTypes(): string[];
    hasSchema(eventType: string, version?: number): boolean;
}
