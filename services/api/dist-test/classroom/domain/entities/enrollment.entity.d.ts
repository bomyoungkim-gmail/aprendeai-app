export type EnrollmentStatus = 'ACTIVE' | 'REMOVED';
export declare class Enrollment {
    readonly id: string;
    readonly classroomId: string;
    readonly learnerUserId: string;
    readonly nickname?: string;
    readonly status: EnrollmentStatus;
    readonly enrolledAt: Date;
    constructor(id: string, classroomId: string, learnerUserId: string, nickname?: string, status?: EnrollmentStatus, enrolledAt?: Date);
}
