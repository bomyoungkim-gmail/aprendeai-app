import { ConfigService } from "@nestjs/config";
import { ValidateOAuthUseCase } from "../../application/validate-oauth.use-case";
declare const MicrosoftStrategy_base: new (...args: any) => any;
export declare class MicrosoftStrategy extends MicrosoftStrategy_base {
    private config;
    private validateOAuthUseCase;
    constructor(config: ConfigService, validateOAuthUseCase: ValidateOAuthUseCase);
    validate(accessToken: string, refreshToken: string, profile: any, done: (err: any, user?: any, info?: any) => void): Promise<any>;
}
export {};
