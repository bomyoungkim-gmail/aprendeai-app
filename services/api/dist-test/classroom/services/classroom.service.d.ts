import { CreateClassroomDto, UpdateClassroomDto } from "../dto/classroom.dto";
import { CreateClassroomUseCase } from "../application/use-cases/create-classroom.use-case";
import { GetClassroomUseCase } from "../application/use-cases/get-classroom.use-case";
import { UpdateClassroomUseCase } from "../application/use-cases/update-classroom.use-case";
import { DeleteClassroomUseCase } from "../application/use-cases/delete-classroom.use-case";
import { GetEducatorClassroomsUseCase } from "../application/use-cases/get-educator-classrooms.use-case";
export declare class ClassroomService {
    private readonly createUseCase;
    private readonly getUseCase;
    private readonly updateUseCase;
    private readonly deleteUseCase;
    private readonly getEducatorClassroomsUseCase;
    constructor(createUseCase: CreateClassroomUseCase, getUseCase: GetClassroomUseCase, updateUseCase: UpdateClassroomUseCase, deleteUseCase: DeleteClassroomUseCase, getEducatorClassroomsUseCase: GetEducatorClassroomsUseCase);
    create(dto: CreateClassroomDto): Promise<import("../domain/entities/classroom.entity").Classroom>;
    getById(classroomId: string): Promise<import("../domain/entities/classroom.entity").Classroom>;
    getByEducator(educatorUserId: string): Promise<{
        classroomId: string;
        name: string;
        gradeLevel: string;
        enrollmentCount: number;
    }[]>;
    update(classroomId: string, dto: UpdateClassroomDto): Promise<import("../domain/entities/classroom.entity").Classroom>;
    delete(classroomId: string): Promise<void>;
}
