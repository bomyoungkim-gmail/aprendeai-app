import { ClassPrivacyMode, StudentData } from "./types";
export declare class ClassroomPrivacyGuard {
    private readonly logger;
    filterStudentData(data: StudentData, privacyMode: ClassPrivacyMode): StudentData;
    filterStudentList(students: StudentData[], privacyMode: ClassPrivacyMode): StudentData[];
    canViewStudentDetails(privacyMode: ClassPrivacyMode): boolean;
    shouldRevealDetailsOnHelpRequest(privacyMode: ClassPrivacyMode): boolean;
}
