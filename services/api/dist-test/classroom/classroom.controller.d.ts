import { ClassroomService } from "./services/classroom.service";
import { EnrollmentService } from "./services/enrollment.service";
import { ClassPolicyService } from "./services/class-policy.service";
import { ClassPlanService } from "./services/class-plan.service";
import { ClassInterventionService } from "./services/class-intervention.service";
import { ClassDashboardService } from "./services/class-dashboard.service";
import { ClassGradebookService } from "./services/class-gradebook.service";
import { CreateClassroomDto, UpdateClassroomDto, EnrollStudentDto, CreateClassPolicyDto, CreateWeeklyPlanDto, LogInterventionDto, GetPolicyPromptDto, GetWeeklyPlanPromptDto, GetInterventionPromptDto, GetDashboardPromptDto } from "./dto/classroom.dto";
export declare class ClassroomController {
    private readonly classroomService;
    private readonly enrollmentService;
    private readonly classPolicyService;
    private readonly classPlanService;
    private readonly classInterventionService;
    private readonly classDashboardService;
    private readonly classGradebookService;
    constructor(classroomService: ClassroomService, enrollmentService: EnrollmentService, classPolicyService: ClassPolicyService, classPlanService: ClassPlanService, classInterventionService: ClassInterventionService, classDashboardService: ClassDashboardService, classGradebookService: ClassGradebookService);
    create(dto: CreateClassroomDto): Promise<{
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
    }>;
    getById(id: string): Promise<{
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
    }>;
    update(id: string, dto: UpdateClassroomDto): Promise<{
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
    }>;
    delete(id: string): Promise<void>;
    getMyClassrooms(user: any): Promise<{
        classroomId: string;
        name: string;
        gradeLevel: string;
        enrollmentCount: number;
    }[]>;
    enroll(classroomId: string, dto: EnrollStudentDto): Promise<{
        id: any;
        classroomId: any;
        learnerUserId: any;
        status: any;
        nickname: any;
        enrolledAt: any;
    }>;
    getEnrollments(classroomId: string): Promise<{
        id: any;
        classroomId: any;
        learnerUserId: any;
        status: any;
        nickname: any;
        enrolledAt: any;
    }[]>;
    upsertPolicy(classroomId: string, dto: CreateClassPolicyDto): Promise<{
        id: string;
        classroomId: string;
        timeboxDefaultMin: number;
        weeklyUnitsTarget: number;
        toolWordsGateEnabled: boolean;
        dailyReviewCap: number;
        privacyMode: import(".prisma/client").$Enums.ClassPrivacyMode;
        interventionMode: import(".prisma/client").$Enums.InterventionMode;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getPolicy(classroomId: string): Promise<{
        id: string;
        classroomId: string;
        timeboxDefaultMin: number;
        weeklyUnitsTarget: number;
        toolWordsGateEnabled: boolean;
        dailyReviewCap: number;
        privacyMode: import(".prisma/client").$Enums.ClassPrivacyMode;
        interventionMode: import(".prisma/client").$Enums.InterventionMode;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createWeeklyPlan(classroomId: string, req: any, dto: CreateWeeklyPlanDto): Promise<{
        id: string;
        classroomId: string;
        weekStart: Date;
        createdByEducatorId: string;
        title: string;
        notes: string;
        itemsJson: import("@prisma/client/runtime/library").JsonValue;
        toolWordsJson: import("@prisma/client/runtime/library").JsonValue;
        checkpointsJson: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getCurrentWeekPlan(classroomId: string): Promise<{
        id: string;
        classroomId: string;
        weekStart: Date;
        createdByEducatorId: string;
        title: string;
        notes: string;
        itemsJson: import("@prisma/client/runtime/library").JsonValue;
        toolWordsJson: import("@prisma/client/runtime/library").JsonValue;
        checkpointsJson: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getDashboard(classroomId: string): Promise<{
        classroomId: string;
        className: string;
        activeStudents: number;
        avgProgress: number;
        students: import("../privacy/types").StudentData[];
        privacyMode: import("../privacy/types").ClassPrivacyMode;
    }>;
    logHelpRequest(classroomId: string, dto: LogInterventionDto): Promise<{
        timestamp: Date;
        topic: string;
        status: string;
    }>;
    getPolicyPrompt(classroomId: string, dto: GetPolicyPromptDto): Promise<import("../prompts/dto/canonical-prompt.dto").CanonicalPrompt>;
    getWeeklyPlanPrompt(classroomId: string, dto: GetWeeklyPlanPromptDto): Promise<import("../prompts/dto/canonical-prompt.dto").CanonicalPrompt>;
    getInterventionPrompt(classroomId: string, dto: GetInterventionPromptDto): Promise<import("../prompts/dto/canonical-prompt.dto").CanonicalPrompt>;
    getDashboardPrompt(classroomId: string, dto: GetDashboardPromptDto): Promise<import("../prompts/dto/canonical-prompt.dto").CanonicalPrompt>;
    getGradebook(classroomId: string): Promise<{
        students: any[];
        assignments: any[];
        contentIds?: undefined;
        data?: undefined;
    } | {
        contentIds: string[];
        data: {
            studentId: string;
            name: string;
            email: string;
            scores: {};
        }[];
        students?: undefined;
        assignments?: undefined;
    }>;
    exportGradebook(classroomId: string): Promise<{
        csv: string;
    }>;
    getStudyItems(classroomId: string): Promise<{
        plans: {
            id: string;
            classroomId: string;
            weekStart: Date;
            createdByEducatorId: string;
            title: string;
            notes: string;
            itemsJson: import("@prisma/client/runtime/library").JsonValue;
            toolWordsJson: import("@prisma/client/runtime/library").JsonValue;
            checkpointsJson: import("@prisma/client/runtime/library").JsonValue;
            createdAt: Date;
            updatedAt: Date;
        }[];
    }>;
}
