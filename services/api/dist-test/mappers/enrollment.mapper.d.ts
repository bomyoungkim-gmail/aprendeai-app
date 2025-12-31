export declare class EnrollmentMapper {
    static toDto(enrollment: any | null): {
        id: any;
        classroomId: any;
        learnerUserId: any;
        status: any;
        nickname: any;
        enrolledAt: any;
    };
    static toCollectionDto(enrollments: any[]): {
        id: any;
        classroomId: any;
        learnerUserId: any;
        status: any;
        nickname: any;
        enrolledAt: any;
    }[];
}
