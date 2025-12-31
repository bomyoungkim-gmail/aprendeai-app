"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassroomService = void 0;
const common_1 = require("@nestjs/common");
const create_classroom_use_case_1 = require("../application/use-cases/create-classroom.use-case");
const get_classroom_use_case_1 = require("../application/use-cases/get-classroom.use-case");
const update_classroom_use_case_1 = require("../application/use-cases/update-classroom.use-case");
const delete_classroom_use_case_1 = require("../application/use-cases/delete-classroom.use-case");
const get_educator_classrooms_use_case_1 = require("../application/use-cases/get-educator-classrooms.use-case");
let ClassroomService = class ClassroomService {
    constructor(createUseCase, getUseCase, updateUseCase, deleteUseCase, getEducatorClassroomsUseCase) {
        this.createUseCase = createUseCase;
        this.getUseCase = getUseCase;
        this.updateUseCase = updateUseCase;
        this.deleteUseCase = deleteUseCase;
        this.getEducatorClassroomsUseCase = getEducatorClassroomsUseCase;
    }
    async create(dto) {
        return this.createUseCase.execute({
            name: dto.name,
            ownerEducatorId: dto.ownerEducatorUserId,
            institutionId: dto.institutionId,
            gradeLevel: dto.gradeLevel,
        });
    }
    async getById(classroomId) {
        return this.getUseCase.execute(classroomId);
    }
    async getByEducator(educatorUserId) {
        return this.getEducatorClassroomsUseCase.execute(educatorUserId);
    }
    async update(classroomId, dto) {
        return this.updateUseCase.execute(classroomId, dto);
    }
    async delete(classroomId) {
        return this.deleteUseCase.execute(classroomId);
    }
};
exports.ClassroomService = ClassroomService;
exports.ClassroomService = ClassroomService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [create_classroom_use_case_1.CreateClassroomUseCase,
        get_classroom_use_case_1.GetClassroomUseCase,
        update_classroom_use_case_1.UpdateClassroomUseCase,
        delete_classroom_use_case_1.DeleteClassroomUseCase,
        get_educator_classrooms_use_case_1.GetEducatorClassroomsUseCase])
], ClassroomService);
//# sourceMappingURL=classroom.service.js.map