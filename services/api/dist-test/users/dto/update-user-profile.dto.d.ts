export declare enum Gender {
    MALE = "MALE",
    FEMALE = "FEMALE",
    OTHER = "OTHER",
    PREFER_NOT_TO_SAY = "PREFER_NOT_TO_SAY"
}
export declare enum EducationLevel {
    FUNDAMENTAL = "FUNDAMENTAL",
    MEDIO = "MEDIO",
    SUPERIOR = "SUPERIOR",
    POS_GRADUACAO = "POS_GRADUACAO"
}
export declare class UpdateUserProfileDto {
    name?: string;
    schoolingLevel?: EducationLevel;
    address?: string;
    sex?: Gender;
    birthday?: string;
    age?: number;
    bio?: string;
}
