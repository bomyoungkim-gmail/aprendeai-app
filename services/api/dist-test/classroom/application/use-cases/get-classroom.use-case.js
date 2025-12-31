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
exports.GetClassroomUseCase = void 0;
const common_1 = require("@nestjs/common");
const classroom_repository_interface_1 = require("../../domain/interfaces/classroom.repository.interface");
let GetClassroomUseCase = class GetClassroomUseCase {
    constructor(classroomRepo) {
        this.classroomRepo = classroomRepo;
    }
    async execute(id) {
        const classroom = await this.classroomRepo.findById(id);
        if (!classroom) {
            throw new common_1.NotFoundException(`Classroom with ID ${id} not found`);
        }
        return classroom;
    }
};
exports.GetClassroomUseCase = GetClassroomUseCase;
exports.GetClassroomUseCase = GetClassroomUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(classroom_repository_interface_1.IClassroomRepository)),
    __metadata("design:paramtypes", [Object])
], GetClassroomUseCase);
//# sourceMappingURL=get-classroom.use-case.js.map