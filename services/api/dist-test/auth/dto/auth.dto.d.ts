export declare class RegisterDto {
    name: string;
    email: string;
    password: string;
    institutionId?: string;
    schoolingLevel?: string;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class ForgotPasswordDto {
    email: string;
}
export declare class ResetPasswordDto {
    token: string;
    password: string;
}
