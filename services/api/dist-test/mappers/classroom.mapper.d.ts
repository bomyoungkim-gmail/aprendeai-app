export declare class ClassroomMapper {
    static toDto(classroom: any | null): {
        id: any;
        institutionId: any;
        ownerEducatorUserId: any;
        name: any;
        description: any;
        gradeLevel: any;
        status: string;
        accessCode: any;
        studentUnenrollmentMode: string;
        metadata: any;
        createdAt: any;
        updatedAt: any;
        enrollments: any;
    };
    static toCollectionDto(classrooms: any[]): {
        id: any;
        institutionId: any;
        ownerEducatorUserId: any;
        name: any;
        description: any;
        gradeLevel: any;
        status: string;
        accessCode: any;
        studentUnenrollmentMode: string;
        metadata: any;
        createdAt: any;
        updatedAt: any;
        enrollments: any;
    }[];
}
