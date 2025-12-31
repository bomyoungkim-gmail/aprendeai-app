import { Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptions] | [opt: import("passport-jwt").StrategyOptions]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private prisma;
    constructor(configService: ConfigService, prisma: PrismaService);
    validate(payload: any): Promise<{
        clientId: any;
        scopes: any;
        institutionId: any;
        contextRole: any;
        systemRole: any;
        id: string;
        email: string;
        name: string;
        settings: import("@prisma/client/runtime/library").JsonValue;
    }>;
}
export {};
