export interface TestUser {
    id: string;
    email: string;
    name: string;
}
export declare class TestAuthHelper {
    private jwtService;
    constructor(jwtSecret: string);
    generateToken(user: TestUser): string;
    generateAuthHeader(user: TestUser): string;
    generateExpiredToken(user: TestUser): string;
    verifyToken(token: string): any;
}
export declare function createTestUser(overrides?: Partial<TestUser>): TestUser;
