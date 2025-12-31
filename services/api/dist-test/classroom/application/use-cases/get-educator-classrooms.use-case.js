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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetEducatorClassroomsUseCase = void 0;
const common_1 = require("@nestjs/common");
const classroom_repository_interface_1 = require("../../domain/interfaces/classroom.repository.interface");
let GetEducatorClassroomsUseCase = class GetEducatorClassroomsUseCase {
    constructor(classroomRepo) {
        this.classroomRepo = classroomRepo;
    }
    async execute(educatorId) {
        const classrooms = await this.classroomRepo.findByEducator(educatorId);
        return Promise.all(classrooms.map(async (c) => {
            var _a;
            const enrollmentCount = await this.classroomRepo.countEnrollments(c.id);
            return {
                classroomId: c.id,
                name: c.name,
                gradeLevel: (_a = c.gradeLevel) !== null && _a !== void 0 ? _a : 'N/A',
                enrollmentCount,
            };
        }));
    }
};
exports.GetEducatorClassroomsUseCase = GetEducatorClassroomsUseCase;
exports.GetEducatorClassroomsUseCase = GetEducatorClassroomsUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(classroom_repository_interface_1.IClassroomRepository)),
    __metadata("design:paramtypes", [Object])
], GetEducatorClassroomsUseCase);
//# sourceMappingURL=get-educator-classrooms.use-case.js.map