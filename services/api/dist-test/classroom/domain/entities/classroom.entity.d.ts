export declare class Classroom {
    readonly id: string;
    readonly name: string;
    readonly ownerEducatorId: string;
    readonly institutionId: string;
    readonly gradeLevel?: string;
    readonly updatedAt: Date;
    constructor(id: string, name: string, ownerEducatorId: string, institutionId: string, gradeLevel?: string, updatedAt?: Date);
}
